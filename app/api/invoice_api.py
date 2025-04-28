from flask import Blueprint, request, jsonify
from flask.views import MethodView
from app.services.ocr_service import OCRService
import os
from werkzeug.utils import secure_filename
from datetime import datetime

from app.models.invoice import Invoice
from sqlalchemy import func
from app.core.extensions import db

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
        results = [] # Cambiado a results para reflejar éxito/error por archivo
        invoices_to_add = [] # Lista para añadir facturas a la sesión
        today_folder = datetime.utcnow().strftime("%Y-%m-%d")
        upload_dir = os.path.join(UPLOAD_FOLDER, today_folder) # Usar la constante
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
                continue # Saltar al siguiente archivo

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

            # Check de existencia previa (por filename exacto - mantener o mejorar con hash)
            existing_invoice = Invoice.query.filter(func.lower(Invoice.filename) == filename.lower()).first()

            if existing_invoice:
                # Crear registro duplicado
                invoice = Invoice(
                    filename=filename,
                    file_path=filepath, # Guardamos la ruta donde se intentó guardar/se guardó
                    status="duplicated"
                )
                # No añadir a invoices_to_add si no queremos duplicados en DB
                # Opcional: añadir a una lista separada si se quieren guardar los duplicados
                db.session.add(invoice) # Decidimos guardar el registro duplicado

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
                status="processing"
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

        # 3. Transacción única de BD
        if invoices_to_add:
            try:
                db.session.add_all(invoices_to_add)
                db.session.flush() # Para obtener los IDs si los necesitamos ahora

                # Actualizar IDs en la respuesta y lanzar tareas
                processed_index = 0
                for i, result in enumerate(results):
                    # Solo actualizar y lanzar tarea para las facturas añadidas correctamente
                    if result["status"] == "processing" and result["invoice_id"] is None:
                         # Asegurarse que el índice coincide con la factura en invoices_to_add
                        if processed_index < len(invoices_to_add):
                            invoice = invoices_to_add[processed_index]
                            results[i]["invoice_id"] = invoice.id # Asignar ID real

                            # Lanzar tarea Celery
                            from app.tasks.invoice_tasks import process_invoice_task
                            process_invoice_task.delay(invoice.id)
                            results[i]["message"] = "La factura está siendo procesada automáticamente" # Mensaje actualizado
                            processed_index += 1
                        else:
                             # Esto no debería pasar si la lógica es correcta, pero por seguridad
                             results[i]["status"] = "error"
                             results[i]["message"] = "Error interno al obtener ID de factura."


                db.session.commit() # Commit final
            except Exception as e:
                db.session.rollback()
                # Considerar loguear el error 'e'
                # Marcar las facturas correspondientes en 'results' como fallidas
                for i, result in enumerate(results):
                     if result["status"] == "processing" and result["invoice_id"] is None:
                         results[i]["status"] = "error"
                         results[i]["message"] = "Error al guardar los registros en la base de datos."
                return jsonify({
                    "error": "Ocurrió un error al procesar algunos archivos en la base de datos.",
                    "details": results # Devolver detalle de qué falló
                    }), 500

        return jsonify(results), 202


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