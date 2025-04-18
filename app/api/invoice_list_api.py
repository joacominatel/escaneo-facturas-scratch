from flask import Blueprint, jsonify, request
from flask.views import MethodView
from app.models.invoice import Invoice

invoice_list_bp = Blueprint('invoice_list_bp', __name__)

class InvoiceListAPI(MethodView):
    def get(self):
        status = request.args.get('status')  # Opcional: filtrar por estado

        query = Invoice.query
        if status:
            query = query.filter_by(status=status)

        invoices = query.order_by(Invoice.created_at.desc()).all()

        return jsonify([
            {
                "id": invoice.id,
                "filename": invoice.filename,
                "status": invoice.status,
                "created_at": invoice.created_at.isoformat()
            }
            for invoice in invoices
        ]), 200

invoice_list_bp.add_url_rule('/api/invoices/', view_func=InvoiceListAPI.as_view('invoice_list'), methods=['GET'])
