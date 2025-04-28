from flask import Blueprint, jsonify
from flask.views import MethodView
from app.models.invoice import Invoice
from app.core.extensions import db
from app.services.openai_service import OpenAIService
from app.tasks.invoice_tasks import db_session_context_with_event

invoice_confirm_bp = Blueprint('invoice_confirm_bp', __name__)
openai_service = OpenAIService()

class InvoiceConfirmAPI(MethodView):
    def post(self, invoice_id):
        invoice_data_for_response = {}
        with db_session_context_with_event() as session:
            invoice = session.query(Invoice).get(invoice_id)

            if not invoice:
                return jsonify({"error": "Factura no encontrada"}), 404

            if not invoice.preview_data:
                return jsonify({"error": "No hay datos previos para confirmar"}), 400

            invoice.final_data = invoice.preview_data
            invoice.status = "processed"
            session.add(invoice)

            # Guardar datos para la respuesta ANTES de cerrar la sesión
            invoice_data_for_response = {
                "id": invoice.id,
                "status": invoice.status
            }

        # Usar los datos guardados en la respuesta
        return jsonify({
            "invoice_id": invoice_data_for_response.get("id"),
            "status": invoice_data_for_response.get("status"),
            "message": "Factura confirmada y finalizada correctamente."
        }), 200


invoice_confirm_bp.add_url_rule('/api/invoices/<int:invoice_id>/confirm', view_func=InvoiceConfirmAPI.as_view('invoice_confirm'), methods=['POST'])
