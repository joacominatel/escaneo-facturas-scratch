from flask import Blueprint, send_file, abort
from flask.views import MethodView
from app.models.invoice import Invoice
import os

invoice_download_bp = Blueprint('invoice_download_bp', __name__)

class InvoiceDownloadAPI(MethodView):
    def get(self, invoice_id):
        invoice = Invoice.query.get(invoice_id)

        if not invoice:
            return abort(404, description="Factura no encontrada.")

        if not invoice.file_path or not os.path.isfile(invoice.file_path):
            return abort(404, description="Archivo no encontrado en el servidor.")

        return send_file(f"/app/{invoice.file_path}", as_attachment=True)

invoice_download_bp.add_url_rule('/api/invoices/<int:invoice_id>/download', view_func=InvoiceDownloadAPI.as_view('invoice_download'), methods=['GET'])
