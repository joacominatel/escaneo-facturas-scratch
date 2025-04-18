from flask import Blueprint, jsonify
from flask.views import MethodView
from app.models.invoice import Invoice
from app.models.invoice_log import InvoiceLog
from app.core.extensions import db
from app.tasks.invoice_tasks import process_invoice_task

invoice_retry_bp = Blueprint('invoice_retry_bp', __name__)

class InvoiceRetryAPI(MethodView):
    def post(self, invoice_id):
        invoice = Invoice.query.get(invoice_id)

        if not invoice:
            return jsonify({"error": "Factura no encontrada"}), 404

        if invoice.status not in ["failed", "rejected"]:
            return jsonify({"error": f"Solo se pueden reintentar facturas fallidas o rechazadas. Estado actual: {invoice.status}"}), 400

        # Cambio de estado
        invoice.status = "processing"
        db.session.add(invoice)

        # Log de reintento
        db.session.add(InvoiceLog(
            invoice_id=invoice.id,
            event="retry_requested",
            details="Reintento manual solicitado."
        ))

        db.session.commit()

        # Encolamos nuevamente en Celery
        process_invoice_task.delay(invoice.id)

        return jsonify({
            "invoice_id": invoice.id,
            "status": "processing",
            "message": "Factura enviada nuevamente a procesamiento."
        }), 202

invoice_retry_bp.add_url_rule('/api/invoices/<int:invoice_id>/retry', view_func=InvoiceRetryAPI.as_view('invoice_retry'), methods=['POST'])
