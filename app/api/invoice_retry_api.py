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

        # Obtener la última razón de rechazo, si existe
        rejection_reason = None
        last_rejection_log = InvoiceLog.query.filter_by(invoice_id=invoice_id, event="rejected").order_by(InvoiceLog.id.desc()).first()
        if last_rejection_log and last_rejection_log.details:
            rejection_reason = last_rejection_log.details
            print(f"Reintentando factura {invoice_id} con razón de rechazo anterior: {rejection_reason}")

        # Cambio de estado
        invoice.status = "processing"
        db.session.add(invoice)

        # Log de reintento
        db.session.add(InvoiceLog(
            invoice_id=invoice.id,
            event="retry_requested",
            details=f"Reintento manual solicitado.{' Con contexto de rechazo anterior.' if rejection_reason else ''}"
        ))

        db.session.commit()

        # Encolamos nuevamente en Celery, pasando la razón del rechazo si existe
        process_invoice_task.delay(invoice.id, rejection_reason=rejection_reason)

        return jsonify({
            "invoice_id": invoice.id,
            "status": "processing",
            "message": "Factura enviada nuevamente a procesamiento."
        }), 202

invoice_retry_bp.add_url_rule('/api/invoices/<int:invoice_id>/retry', view_func=InvoiceRetryAPI.as_view('invoice_retry'), methods=['POST'])
