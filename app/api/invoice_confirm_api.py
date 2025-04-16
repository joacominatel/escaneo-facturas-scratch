from flask import Blueprint, jsonify
from flask.views import MethodView
from app.models.invoice import Invoice
from app.models.invoice_log import InvoiceLog
from app.core.extensions import db
from app.services.openai_service import OpenAIService

invoice_confirm_bp = Blueprint('invoice_confirm_bp', __name__)
openai_service = OpenAIService()

class InvoiceConfirmAPI(MethodView):
    def post(self, invoice_id):
        invoice = Invoice.query.get(invoice_id)

        if not invoice:
            return jsonify({"error": "Factura no encontrada"}), 404

        if invoice.status != "waiting_validation":
            return jsonify({"error": "La factura ya fue procesada o tiene un estado inválido"}), 400

        # Buscar texto OCR desde el log
        log = InvoiceLog.query.filter_by(invoice_id=invoice.id, event="ocr_extracted").first()
        if not log:
            return jsonify({"error": "No se encontró texto OCR para esta factura"}), 500

        try:
            structured_data = openai_service.extract_structured_data(log.details)

            invoice.status = "processed"
            invoice.final_data = structured_data

            db.session.add(invoice)
            db.session.add(InvoiceLog(invoice_id=invoice.id, event="final_processing", details=str(structured_data)))
            db.session.commit()

            return jsonify({
                "invoice_id": invoice.id,
                "status": invoice.status,
                "data": structured_data
            }), 200

        except Exception as e:
            return jsonify({"error": str(e)}), 500

invoice_confirm_bp.add_url_rule('/api/invoices/<int:invoice_id>/confirm', view_func=InvoiceConfirmAPI.as_view('invoice_confirm'), methods=['POST'])
