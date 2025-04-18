from flask import Blueprint, jsonify
from flask.views import MethodView
from app.models.invoice import Invoice
from app.models.invoice_log import InvoiceLog
from app.core.extensions import db
from app.services.openai_service import OpenAIService
from app.tasks.invoice_tasks import process_invoice_task

invoice_confirm_bp = Blueprint('invoice_confirm_bp', __name__)
openai_service = OpenAIService()

class InvoiceConfirmAPI(MethodView):
    def post(self, invoice_id):
        invoice = Invoice.query.get(invoice_id)

        if not invoice:
            return jsonify({"error": "Factura no encontrada"}), 404

        if invoice.status != "waiting_validation":
            return jsonify({"error": "La factura ya fue procesada o tiene un estado inválido"}), 400

        # Confirmamos que haya texto OCR
        log = InvoiceLog.query.filter_by(invoice_id=invoice.id, event="ocr_extracted").first()
        if not log:
            return jsonify({"error": "No se encontró texto OCR para esta factura"}), 500

        # Cambiamos el estado a "processing" para reflejarlo de inmediato
        invoice.status = "processing"
        db.session.commit()

        # Encolamos la tarea en Celery
        process_invoice_task.delay(invoice.id)

        # Respondemos inmediatamente
        return jsonify({
            "invoice_id": invoice.id,
            "status": "processing",
            "message": "El procesamiento está en curso. Consultá luego el estado con GET /api/invoices/{id}"
        }), 202

invoice_confirm_bp.add_url_rule('/api/invoices/<int:invoice_id>/confirm', view_func=InvoiceConfirmAPI.as_view('invoice_confirm'), methods=['POST'])
