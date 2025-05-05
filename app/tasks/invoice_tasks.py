from app.core.celery_app import celery
from app.core.extensions import db, socketio
from app.models.invoice import Invoice
from app.models.invoice_log import InvoiceLog
from app.models.company_prompt import CompanyPrompt
from app.services.openai_service import OpenAIService
from app.services.ocr_service import OCRService
from app.services.company_service import CompanyService
import time
import contextlib
import os
import psutil
import gc

# Monitoreo sencillo de recursos
def get_resource_usage():
    process = psutil.Process(os.getpid())
    mem_info = process.memory_info()
    return {
        "memory_mb": mem_info.rss / 1024 / 1024,
        "cpu_percent": process.cpu_percent(interval=0.1)
    }

# Context manager para administrar sesiones de base de datos y emitir eventos
@contextlib.contextmanager
def db_session_context_with_event(namespace='/invoices', event_name='invoice_status_update'):
    """Context manager para asegurar commit y emitir evento SocketIO después."""
    session = db.session()
    updated_invoice_data = None
    try:
        yield session
        # Buscar la factura modificada antes del commit para obtener datos actualizados
        # Esto asume que la factura relevante fue añadida o modificada en la sesión
        for obj in session.identity_map.values():
            if isinstance(obj, Invoice) and session.is_modified(obj):
                 updated_invoice_data = {
                     'id': obj.id,
                     'status': obj.status,
                     'filename': obj.filename
                 }
                 break # solo modificamos una factura por contexto
            elif isinstance(obj, Invoice) and obj in session.new:
                 # Para facturas nuevas (ej. estado 'processing' inicial)
                 # el ID no estará hasta después del flush/commit
                 pass

        session.commit()

        # Intentar obtener datos de la factura recién creada si es necesario
        if not updated_invoice_data:
            for obj in session.identity_map.values():
                 if isinstance(obj, Invoice) and obj in session.new:
                      # Ahora debería tener ID después del commit
                      updated_invoice_data = {
                          'id': obj.id,
                          'status': obj.status,
                          'filename': obj.filename
                      }
                      break

        # Emitir evento DESPUÉS del commit exitoso
        if updated_invoice_data:
            try:
                socketio.emit(event_name, updated_invoice_data, namespace=namespace)
                print(f"Evento SocketIO emitido: {event_name} para factura {updated_invoice_data['id']}")
            except Exception as socket_err:
                 # Loguear el error de emisión de SocketIO pero no revertir el commit de DB
                 print(f"Error al emitir evento SocketIO: {socket_err}")

    except Exception as e:
        session.rollback()
        print(f"Error en DB, rollback realizado: {e}")
        raise
    finally:
        session.close()

@celery.task(name="process_invoice_task", bind=True, rate_limit="2/m", autoretry_for=(Exception,), retry_backoff=True, retry_kwargs={"max_retries": 3})
def process_invoice_task(self, invoice_id):
    """
    Procesa una factura extrayendo texto con OCR y luego utilizando OpenAI para estructurar los datos.
    
    Mejoras implementadas:
    - Control de recursos con rate_limit
    - Reintentos automáticos con backoff
    - Manejo optimizado de sesiones de base de datos
    - Monitoreo de uso de recursos
    - Caché para reducir procesamiento repetido
    - Liberación explícita de memoria
    - Emisión de eventos SocketIO en cambios de estado
    """
    from app import create_app
    app = create_app()

    task_start_time = time.time()
    print(f"Iniciando procesamiento de factura ID: {invoice_id}")
    
    initial_resources = get_resource_usage()
    print(f"Recursos iniciales: {initial_resources}")
    
    file_path = None
    company_id_for_prompt = None
    
    with app.app_context():
        try:
            # Obtener información inicial y actualizar estado
            with db_session_context_with_event() as session:
                invoice = session.query(Invoice).filter_by(id=invoice_id).first()
                if not invoice:
                    print(f"Factura no encontrada: {invoice_id}")
                    return {"status": "error", "message": "Factura no encontrada"}
                
                file_path = invoice.file_path
                company_id_for_prompt = invoice.company_id
                
                invoice.status = "processing"
                session.add(InvoiceLog(invoice_id=invoice.id, event="processing_started", details="Iniciando procesamiento"))

            if not file_path or not os.path.exists(file_path):
                raise FileNotFoundError(f"No se encontró el archivo en la ruta: {file_path}")

            # 1. OCR
            ocr_start_time = time.time()
            ocr_service = OCRService(cache_enabled=True)
            raw_text = ocr_service.extract_text_from_pdf(file_path)
            ocr_time = time.time() - ocr_start_time

            with db_session_context_with_event() as session:
                invoice = session.query(Invoice).filter_by(id=invoice_id).first()
                if not invoice:
                    raise ValueError(f"No se pudo encontrar la factura {invoice_id} después del OCR")
                session.add(InvoiceLog(
                    invoice_id=invoice_id,
                    event="ocr_extracted", 
                    details=f"OCR completado en {ocr_time:.2f} segundos."
                ))

            if not raw_text or raw_text.strip() == "":
                raise ValueError("El texto extraído por OCR está vacío")
                
            # --- Determinar qué prompt usar --- 
            target_prompt_path = None
            if company_id_for_prompt:
                print(f"Factura {invoice_id} pertenece a la empresa {company_id_for_prompt}. Buscando prompt por defecto...")
                # Usar el servicio para obtener la ruta del prompt
                target_prompt_path = CompanyService.get_default_prompt_path(company_id_for_prompt)
                if target_prompt_path:
                    print(f"Usando prompt específico de la empresa: {target_prompt_path}")
                else:
                    print(f"No se encontró prompt por defecto para la empresa {company_id_for_prompt}. Usando prompt general.")
            else:
                 print(f"Factura {invoice_id} no tiene empresa asignada. Usando prompt general.")
            # Si target_prompt_path sigue siendo None, OpenAIService usará su default
            # --- Fin determinación de prompt --- 
                
            # 2. OpenAI
            openai_start_time = time.time()
            openai_service = OpenAIService(cache_enabled=True)
            # Pasar el prompt_path encontrado (o None)
            structured_data, raw_response = openai_service.extract_structured_data_and_raw(
                raw_text, 
                prompt_path=target_prompt_path 
            )
            openai_time = time.time() - openai_start_time
            
            del raw_text
            gc.collect()
            
            # 3. Actualizar base de datos
            with db_session_context_with_event() as session:
                invoice = session.query(Invoice).filter_by(id=invoice_id).first()
                if not invoice:
                    raise ValueError(f"No se pudo encontrar la factura {invoice_id} al actualizar resultados")
                
                invoice.preview_data = structured_data
                invoice.agent_response = raw_response
                invoice.status = "waiting_validation"
                
                session.add(invoice)
                session.add(InvoiceLog(
                    invoice_id=invoice_id,
                    event="processing_completed", 
                    details=f"Datos extraídos en {openai_time:.2f} segundos."
                ))

            print(f"Procesamiento exitoso de factura {invoice_id}")
            
        except Exception as e:
            print(f"Error en procesamiento de factura {invoice_id}: {str(e)}")
            try:
                with db_session_context_with_event() as session:
                    invoice = session.query(Invoice).filter_by(id=invoice_id).first()
                    if invoice:
                        invoice.status = "failed"
                        session.add(invoice)
                        session.add(InvoiceLog(
                            invoice_id=invoice_id,
                            event="processing_failed", 
                            details=f"Error: {str(e)[:500]}"
                        ))
            except Exception as db_error:
                print(f"Error adicional al registrar falla: {str(db_error)}")
            raise
        finally:
            final_resources = get_resource_usage()
            total_time = time.time() - task_start_time
            print(f"Recursos finales: {final_resources}")
            print(f"Procesamiento de factura {invoice_id} completado en {total_time:.2f} segundos")
            gc.collect()
