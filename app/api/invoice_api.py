from flask import Blueprint, request, jsonify
from flask.views import MethodView
from app.services.ocr_service import OCRService
import os
from werkzeug.utils import secure_filename
from datetime import datetime

from app.models.invoice import Invoice
from app.core.extensions import db

invoice_bp = Blueprint('invoice_bp', __name__)
ocr_service = OCRService(lang="spa")
UPLOAD_FOLDER = "uploads/"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

class InvoiceOCRAPI(MethodView):
    def post(self):
        if 'file' not in request.files:
            return jsonify({"error": "No se encontraron archivos"}), 400

        files = request.files.getlist("file")
        tmp_results = []
        today_folder = datetime.utcnow().strftime("%Y-%m-%d")
        upload_dir = os.path.join("uploads", today_folder)
        os.makedirs(upload_dir, exist_ok=True)

        for file in files:
            filename = secure_filename(file.filename)
            filepath = os.path.join(upload_dir, filename)
            file.save(filepath)

            invoice = Invoice(
                filename=filename,
                file_path=filepath,
                status="processing"
            )
            db.session.add(invoice)
            db.session.commit()

            from app.tasks.invoice_tasks import process_invoice_task
            process_invoice_task.delay(invoice.id)

            tmp_results.append({
                "invoice_id": invoice.id,
                "filename": invoice.filename,
                "status": invoice.status,
                "message": "La factura está siendo procesada automáticamente"
            })

        return jsonify(tmp_results), 202


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