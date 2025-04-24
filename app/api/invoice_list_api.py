from flask import Blueprint, jsonify, request
from flask.views import MethodView
from app.models.invoice import Invoice
import hashlib
from sqlalchemy import asc, desc

invoice_list_bp = Blueprint('invoice_list_bp', __name__)

class InvoiceListAPI(MethodView):
    def get(self):
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))
        status = request.args.get('status')
        search = request.args.get('search', '').strip()
        sort_by = request.args.get('sort_by', 'created_at')
        sort_order = request.args.get('sort_order', 'desc')

        query = Invoice.query
        if status:
            query = query.filter_by(status=status)
        if search:
            query = query.filter(Invoice.filename.ilike(f"%{search}%"))

        sort_column = getattr(Invoice, sort_by, Invoice.created_at)
        order_func = desc if sort_order.lower() == "desc" else asc
        query = query.order_by(order_func(sort_column))

        pagination = query.paginate(page=page, per_page=per_page, error_out=False)

        result = {
            "page": page,
            "per_page": per_page,
            "total": pagination.total,
            "pages": pagination.pages,
            "invoices": [
                {
                    "id": invoice.id,
                    "filename": invoice.filename,
                    "status": invoice.status,
                    "created_at": invoice.created_at.isoformat()
                }
                for invoice in pagination.items
            ]
        }

        return jsonify(result), 200

invoice_list_bp.add_url_rule('/api/invoices/', view_func=InvoiceListAPI.as_view('invoice_list'), methods=['GET'])
