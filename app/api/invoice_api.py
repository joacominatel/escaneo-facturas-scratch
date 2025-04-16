from flask import Blueprint, request, jsonify
from flask.views import MethodView
from app.services.ocr_service import OCRService
from app.utils.file_extractor import extract_pdfs_from_zip
import os
from werkzeug.utils import secure_filename
from tempfile import mkdtemp
from app.services.openai_service import OpenAIService
import shutil

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
                filename = secure_filename(file.filename)
                file_path = os.path.join(tmp_dir, filename)
                file.save(file_path)

                if filename.lower().endswith(".zip"):
                    pdfs = extract_pdfs_from_zip(file_path, extract_to=tmp_dir)
                    extracted_paths.extend(pdfs)
                elif filename.lower().endswith(".pdf"):
                    extracted_paths.append(file_path)

            if not extracted_paths:
                return jsonify({"error": "No se encontraron PDFs válidos."}), 400

            # Procesar todos los PDFs encontrados
            results = []
            for path in extracted_paths:
                ocr_text = ocr_service.extract_text_from_pdf(path)
                summary = openai_service.summarize_invoice_text(ocr_text)

                # Crear y guardar factura
                invoice = Invoice(filename=os.path.basename(path), status="waiting_validation")
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

# POST /api/invoices/ocr con uno o más archivos
invoice_bp.add_url_rule('/ocr', view_func=InvoiceOCRAPI.as_view('invoice_ocr'), methods=['POST'])
