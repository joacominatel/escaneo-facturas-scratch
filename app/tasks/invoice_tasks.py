from app.core.celery_app import celery
from app.core.extensions import db
from app.models.invoice import Invoice
from app.models.invoice_log import InvoiceLog
from app.services.openai_service import OpenAIService
from app.services.ocr_service import OCRService
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

# Context manager para administrar sesiones de base de datos
@contextlib.contextmanager
def db_session_context():
    """Context manager para asegurar que las sesiones se cierren correctamente"""
    session = db.session()
    try:
        yield session
        session.commit()
    except Exception as e:
        session.rollback()
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
    """
    from app import create_app
    app = create_app()

    task_start_time = time.time()
    print(f"Iniciando procesamiento de factura ID: {invoice_id}")
    
    # Verificar recursos antes de empezar
    initial_resources = get_resource_usage()
    print(f"Recursos iniciales: {initial_resources}")
    
    # Variables para almacenar datos entre sesiones
    file_path = None
    
    with app.app_context():
        try:
            # Obtener información inicial y actualizar estado
            with db_session_context() as session:
                invoice = session.query(Invoice).filter_by(id=invoice_id).first()
                if not invoice:
                    print(f"Factura no encontrada: {invoice_id}")
                    return {"status": "error", "message": "Factura no encontrada"}
                
                # Guardar el file_path para usarlo fuera de la sesión
                file_path = invoice.file_path
                
                # Actualizar estado a "processing"
                invoice.status = "processing"
                session.add(InvoiceLog(invoice_id=invoice.id, event="processing_started", details="Iniciando procesamiento"))
                session.commit()

            # Verificar que tenemos la ruta del archivo
            if not file_path or not os.path.exists(file_path):
                raise FileNotFoundError(f"No se encontró el archivo en la ruta: {file_path}")

            # 1. OCR - Extraer texto del PDF
            ocr_start_time = time.time()
            ocr_service = OCRService(cache_enabled=True)
            raw_text = ocr_service.extract_text_from_pdf(file_path)
            ocr_time = time.time() - ocr_start_time

            # Registrar resultados del OCR
            with db_session_context() as session:
                # Obtener la factura nuevamente en esta sesión
                invoice = session.query(Invoice).filter_by(id=invoice_id).first()
                if not invoice:
                    raise ValueError(f"No se pudo encontrar la factura {invoice_id} después del OCR")
                    
                session.add(InvoiceLog(
                    invoice_id=invoice_id,  # Usar ID directamente
                    event="ocr_extracted", 
                    details=f"OCR completado en {ocr_time:.2f} segundos."
                ))
                session.commit()
                
            # 2. OpenAI - Procesar el texto y obtener datos estructurados
            if not raw_text or raw_text.strip() == "":
                raise ValueError("El texto extraído por OCR está vacío")
                
            openai_start_time = time.time()
            openai_service = OpenAIService(cache_enabled=True)
            structured_data, raw_response = openai_service.extract_structured_data_and_raw(raw_text)
            openai_time = time.time() - openai_start_time
            
            # Liberar memoria después de procesamiento
            del raw_text
            gc.collect()
            
            # 3. Actualizar base de datos con resultados
            with db_session_context() as session:
                invoice = session.query(Invoice).filter_by(id=invoice_id).first()
                if not invoice:
                    raise ValueError(f"No se pudo encontrar la factura {invoice_id} al actualizar resultados")
                
                invoice.preview_data = structured_data
                invoice.agent_response = raw_response
                invoice.status = "waiting_validation"
                
                session.add(invoice)
                session.add(InvoiceLog(
                    invoice_id=invoice_id,  # Usar ID directamente
                    event="processing_completed", 
                    details=f"Datos extraídos en {openai_time:.2f} segundos."
                ))
                session.commit()
                
            print(f"Procesamiento exitoso de factura {invoice_id}")
            
        except Exception as e:
            print(f"Error en procesamiento de factura {invoice_id}: {str(e)}")
            
            # Registrar el error en la base de datos
            try:
                with db_session_context() as session:
                    invoice = session.query(Invoice).filter_by(id=invoice_id).first()
                    if invoice:
                        invoice.status = "failed"
                        session.add(invoice)
                        session.add(InvoiceLog(
                            invoice_id=invoice_id,  # Usar ID directamente
                            event="processing_failed", 
                            details=f"Error: {str(e)[:500]}"
                        ))
                        session.commit()
            except Exception as db_error:
                print(f"Error adicional al registrar falla: {str(db_error)}")
            
            # Reintento automático según la configuración
            raise
        finally:
            # Verificar recursos al finalizar
            final_resources = get_resource_usage()
            total_time = time.time() - task_start_time
            
            print(f"Recursos finales: {final_resources}")
            print(f"Procesamiento de factura {invoice_id} completado en {total_time:.2f} segundos")
            
            # Forzar liberación de memoria
            gc.collect()
