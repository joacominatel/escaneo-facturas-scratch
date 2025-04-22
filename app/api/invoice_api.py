from flask import Blueprint, request, jsonify
from flask.views import MethodView
from app.services.ocr_service import OCRService
from app.utils.file_extractor import extract_pdfs_from_zip
import os
from werkzeug.utils import secure_filename
from tempfile import mkdtemp
from app.services.openai_service import OpenAIService
import shutil
from datetime import datetime

from app.models.invoice import Invoice
from app.models.invoice_log import InvoiceLog
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
        extracted_paths = []
        openai_service = OpenAIService()

        tmp_dir = mkdtemp(dir=UPLOAD_FOLDER)

        try:
            for file in files:
                today_folder = datetime.utcnow().strftime("%Y-%m-%d")
                upload_dir = os.path.join("uploads", today_folder)
                os.makedirs(upload_dir, exist_ok=True)

                filename = secure_filename(file.filename)
                filepath = os.path.join(upload_dir, filename)
                file.save(filepath)

                if filename.lower().endswith(".zip"):
                    pdfs = extract_pdfs_from_zip(filepath, extract_to=tmp_dir)
                    extracted_paths.extend(pdfs)
                elif filename.lower().endswith(".pdf"):
                    extracted_paths.append(filepath)

            if not extracted_paths:
                return jsonify({"error": "No se encontraron PDFs válidos."}), 400

            # Procesar todos los PDFs encontrados
            results = []
            for path in extracted_paths:
                ocr_text = ocr_service.extract_text_from_pdf(path)
                summary = openai_service.summarize_invoice_text(ocr_text)

                # Crear y guardar factura
                invoice = Invoice(
                    filename=filename,
                    file_path=filepath,
                    status="waiting_validation"
                )
                db.session.add(invoice)
                db.session.commit()

                # Log del OCR
                log_ocr = InvoiceLog(invoice_id=invoice.id, event="ocr_extracted", details=ocr_text)
                log_summary = InvoiceLog(invoice_id=invoice.id, event="summary_created", details=summary)
                db.session.add_all([log_ocr, log_summary])
                db.session.commit()

                results.append({
                    "invoice_id": invoice.id,
                    "filename": invoice.filename,
                    "summary": summary,
                    "raw_text": ocr_text
                })

            return jsonify(results), 200
        finally:
            # Limpieza de archivos temporales
            shutil.rmtree(tmp_dir, ignore_errors=True)

class InvoiceDetailAPI(MethodView):
    def get(self, invoice_id):
        invoice = Invoice.query.get(invoice_id)
        if not invoice:
            return jsonify({"error": "Factura no encontrada"}), 404

        return jsonify({
            "invoice_id": invoice.id,
            "status": invoice.status,
            "final_data": invoice.final_data
        }), 200

# POST /api/invoices/ocr con uno o más archivos
invoice_bp.add_url_rule('/ocr', view_func=InvoiceOCRAPI.as_view('invoice_ocr'), methods=['POST'])

# GET /api/invoices/<int:invoice_id>
invoice_bp.add_url_rule('/<int:invoice_id>', view_func=InvoiceDetailAPI.as_view('invoice_detail'), methods=['GET'])