from flask import Blueprint, jsonify
from flask.views import MethodView
from app.models.invoice import Invoice
from app.core.extensions import db
from app.services.openai_service import OpenAIService

invoice_confirm_bp = Blueprint('invoice_confirm_bp', __name__)
openai_service = OpenAIService()

class InvoiceConfirmAPI(MethodView):
    def post(self, invoice_id):
        invoice = Invoice.query.get(invoice_id)

        if not invoice:
            return jsonify({"error": "Factura no encontrada"}), 404

        if not invoice.preview_data:
            return jsonify({"error": "No hay datos previos para confirmar"}), 400

        invoice.final_data = invoice.preview_data
        invoice.status = "processed"

        db.session.commit()

        return jsonify({
            "invoice_id": invoice.id,
            "status": invoice.status,
            "message": "Factura confirmada y finalizada correctamente."
        }), 200


invoice_confirm_bp.add_url_rule('/api/invoices/<int:invoice_id>/confirm', view_func=InvoiceConfirmAPI.as_view('invoice_confirm'), methods=['POST'])
