from flask import Blueprint, jsonify, request
from flask.views import MethodView
from app.models.invoice import Invoice
from app.models.invoice_log import InvoiceLog
from app.core.extensions import db

invoice_reject_bp = Blueprint('invoice_reject_bp', __name__)

class InvoiceRejectAPI(MethodView):
    def post(self, invoice_id):
        invoice = Invoice.query.get(invoice_id)

        if not invoice:
            return jsonify({"error": "Factura no encontrada"}), 404

        if invoice.status not in ["waiting_validation", "processing", "failed"]:
            return jsonify({"error": f"No se puede rechazar una factura con estado {invoice.status}"}), 400

        reason = request.json.get("reason", "Rechazo manual por el usuario.")

        invoice.status = "rejected"
        db.session.add(invoice)
        db.session.add(InvoiceLog(
            invoice_id=invoice.id,
            event="rejected",
            details=reason
        ))
        db.session.commit()

        return jsonify({
            "invoice_id": invoice.id,
            "status": invoice.status,
            "message": "Factura rechazada correctamente."
        }), 200

invoice_reject_bp.add_url_rule('/api/invoices/<int:invoice_id>/reject', view_func=InvoiceRejectAPI.as_view('invoice_reject'), methods=['POST'])
