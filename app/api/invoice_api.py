from flask import Blueprint, request, jsonify
from flask.views import MethodView
from app.services.ocr_service import OCRService
import os
from werkzeug.utils import secure_filename
from datetime import datetime

from app.models.invoice import Invoice
from sqlalchemy import func
from app.core.extensions import db
# Importar el context manager
from app.tasks.invoice_tasks import db_session_context_with_event

invoice_bp = Blueprint('invoice_bp', __name__)
ocr_service = OCRService(lang="spa")
UPLOAD_FOLDER = "uploads/"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Definir tipos de archivo permitidos
ALLOWED_MIME_TYPES = {'application/pdf', 'image/jpeg', 'image/png'}

class InvoiceOCRAPI(MethodView):
    def post(self):
        if 'file' not in request.files:
            return jsonify({"error": "No se encontraron archivos"}), 400

        files = request.files.getlist("file")
        results = [] 
        invoices_to_add = [] # Facturas nuevas para procesar
        invoices_duplicated = [] # Facturas duplicadas detectadas
        today_folder = datetime.utcnow().strftime("%Y-%m-%d")
        upload_dir = os.path.join(UPLOAD_FOLDER, today_folder)
        os.makedirs(upload_dir, exist_ok=True)

        for file in files:
            filename = secure_filename(file.filename)
            filepath = os.path.join(upload_dir, filename)

            # 1. Validación de tipo MIME
            if file.content_type not in ALLOWED_MIME_TYPES:
                results.append({
                    "filename": filename,
                    "status": "error",
                    "message": f"Tipo de archivo no permitido: {file.content_type}. Permitidos: {', '.join(ALLOWED_MIME_TYPES)}"
                })
                continue

            # 2. Manejo de errores al guardar
            try:
                file.save(filepath)
            except Exception as e: # Captura genérica, podría ser más específica (ej. IOError)
                # Considerar loguear el error 'e' para depuración
                results.append({
                    "filename": filename,
                    "status": "error",
                    "message": "Error al guardar el archivo en el servidor."
                })
                continue # Saltar al siguiente archivo

            # Check de existencia previa
            existing_invoice = Invoice.query.filter(func.lower(Invoice.filename) == filename.lower()).first()

            if existing_invoice:
                # Crear registro duplicado
                invoice = Invoice(
                    filename=filename,
                    file_path=filepath, # Guardamos la ruta donde se intentó guardar/se guardó
                    status="duplicated"
                )
                invoices_duplicated.append(invoice) # Añadir a lista de duplicados

                results.append({
                    "invoice_id": None, # O el ID existente si se quiere devolver
                    "filename": invoice.filename,
                    "status": invoice.status,
                    "message": "Factura ya fue procesada anteriormente (detectado por nombre)."
                })
                continue

            # Crear nueva factura para procesamiento
            invoice = Invoice(
                filename=filename,
                file_path=filepath,
                status="processing" # Estado inicial antes de Celery
            )
            invoices_to_add.append(invoice) # Añadir a la lista para commit único

            # El ID no estará disponible hasta después del commit,
            # así que lo recuperaremos después si es necesario para la respuesta
            # o lo dejaremos como None/pendiente en la respuesta inmediata.

            results.append({
                "invoice_id": None, # ID se asignará después del commit
                "filename": invoice.filename,
                "status": invoice.status,
                "message": "La factura ha sido aceptada para procesamiento."
            })

        # 3. Transacción única de BD usando el context manager
        if invoices_to_add or invoices_duplicated:
            try:
                # Usar el context manager para commit y emisión de evento
                with db_session_context_with_event() as session:
                    # Añadir tanto las nuevas como las duplicadas
                    if invoices_to_add:
                        session.add_all(invoices_to_add)
                    if invoices_duplicated:
                         # Asegurarse que el ID de duplicado se refleja si es necesario
                        session.add_all(invoices_duplicated) 

                    # Flush para obtener IDs antes de lanzar tareas y actualizar respuesta
                    session.flush()

                    # Actualizar IDs en la respuesta y lanzar tareas para las NUEVAS facturas
                    processed_index = 0
                    for i, result in enumerate(results):
                        # Solo actualizar y lanzar tarea para las aceptadas para procesamiento
                        if result["status"] == "processing" and result["invoice_id"] is None:
                            if processed_index < len(invoices_to_add):
                                invoice = invoices_to_add[processed_index]
                                results[i]["invoice_id"] = invoice.id # Asignar ID real
                                result["message"] = "La factura está siendo procesada automáticamente" # Mensaje actualizado
                                
                                # Lanzar tarea Celery
                                from app.tasks.invoice_tasks import process_invoice_task
                                process_invoice_task.delay(invoice.id)
                                processed_index += 1
                            else:
                                results[i]["status"] = "error"
                                results[i]["message"] = "Error interno al obtener ID de factura."
                        
                        # Actualizar ID para duplicados si es necesario mostrarlo (aunque no es común)
                        # Buscamos por filename en la lista de duplicados (menos eficiente)
                        # Una mejor alternativa sería usar un diccionario para mapear filename -> invoice_id
                        # Pero por simplicidad, omitimos actualizar el ID de duplicados en la respuesta aquí.
                        # if result["status"] == "duplicated":
                        #     dup_invoice = next((inv for inv in invoices_duplicated if inv.filename == result["filename"]), None)
                        #     if dup_invoice and dup_invoice.id:
                        #         results[i]["invoice_id"] = dup_invoice.id
                
                # El commit y la emisión del evento ocurren aquí al salir del `with`
            
            except Exception as e:
                # El context manager ya hizo rollback
                print(f"Error durante la transacción de subida: {e}")
                # Marcar las facturas correspondientes en 'results' como fallidas
                # (Podríamos refinar esto para saber cuáles exactamente fallaron si el error no fue genérico)
                for result in results:
                     if result["status"] == "processing" or result["status"] == "duplicated":
                         # Asumimos que si hubo un error en el `with`, ninguna se procesó/guardó correctamente
                         result["status"] = "error"
                         result["message"] = "Error al guardar los registros en la base de datos o emitir evento."
                
                # Devolver error 500 con detalles
                return jsonify({
                    "error": "Ocurrió un error al procesar algunos archivos en la base de datos.",
                    "details": results
                    }), 500

        return jsonify(results), 202 # 202 Accepted


class InvoiceDetailAPI(MethodView):
    def get(self, invoice_id):
        invoice = Invoice.query.get(invoice_id)
        if not invoice:
            return jsonify({"error": "Factura no encontrada"}), 404

        return jsonify({
            "invoice_id": invoice.id,
            "status": invoice.status,
            "final_data": invoice.final_data,
            "preview": invoice.preview_data,
        }), 200

# POST /api/invoices/ocr con uno o más archivos
invoice_bp.add_url_rule('/ocr', view_func=InvoiceOCRAPI.as_view('invoice_ocr'), methods=['POST'])

# GET /api/invoices/<int:invoice_id>
invoice_bp.add_url_rule('/<int:invoice_id>', view_func=InvoiceDetailAPI.as_view('invoice_detail'), methods=['GET'])