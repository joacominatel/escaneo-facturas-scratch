from flask import Blueprint, request, jsonify
from flask.views import MethodView
from app.services.ocr_service import OCRService
import os
from werkzeug.utils import secure_filename

invoice_bp = Blueprint('invoice_bp', __name__)
ocr_service = OCRService(lang="spa")  # o "eng" según idioma de facturas

UPLOAD_FOLDER = "uploads/"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

class InvoiceOCRAPI(MethodView):
    def post(self):
        if 'file' not in request.files:
            return jsonify({"error": "Archivo no encontrado"}), 400

        file = request.files['file']
        filename = secure_filename(file.filename)
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)

        try:
            if filename.lower().endswith(".pdf"):
                text = ocr_service.extract_text_from_pdf(filepath)
            else:
                text = ocr_service.extract_text_from_image(filepath)
            return jsonify({"text": text}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

# Ruta: /api/invoices/ocr
invoice_bp.add_url_rule('/ocr', view_func=InvoiceOCRAPI.as_view('invoice_ocr'), methods=['POST'])
