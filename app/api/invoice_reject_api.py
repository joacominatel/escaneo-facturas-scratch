from flask import Blueprint, jsonify, request
from flask.views import MethodView
from app.models.invoice import Invoice
from app.models.invoice_log import InvoiceLog
from app.core.extensions import db
from app.tasks.invoice_tasks import db_session_context_with_event

invoice_reject_bp = Blueprint('invoice_reject_bp', __name__)

class InvoiceRejectAPI(MethodView):
    def post(self, invoice_id):
        invoice_data_for_response = {}
        with db_session_context_with_event() as session:
            invoice = session.query(Invoice).get(invoice_id)

            if not invoice:
                return jsonify({"error": "Factura no encontrada"}), 404

            if invoice.status not in ["waiting_validation", "processing", "failed"]:
                return jsonify({"error": f"No se puede rechazar una factura con estado {invoice.status}"}), 400

            reason = request.json.get("reason", "Rechazo manual por el usuario.")

            invoice.status = "rejected"
            session.add(invoice)
            session.add(InvoiceLog(
                invoice_id=invoice.id,
                event="rejected",
                details=reason
            ))

            # Guardar datos para la respuesta ANTES de cerrar la sesión
            invoice_data_for_response = {
                "id": invoice.id,
                "status": invoice.status
            }

        # Usar los datos guardados en la respuesta
        return jsonify({
            "invoice_id": invoice_data_for_response.get("id"),
            "status": invoice_data_for_response.get("status"),
            "message": "Factura rechazada correctamente."
        }), 200

invoice_reject_bp.add_url_rule('/api/invoices/<int:invoice_id>/reject', view_func=InvoiceRejectAPI.as_view('invoice_reject'), methods=['POST'])
