from flask import Blueprint, jsonify, request
from flask.views import MethodView
from app.models.invoice import Invoice

invoice_list_bp = Blueprint('invoice_list_bp', __name__)

class InvoiceListAPI(MethodView):
    def get(self):
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))
        status = request.args.get('status')

        query = Invoice.query
        if status:
            query = query.filter_by(status=status)

        pagination = query.order_by(Invoice.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)

        invoices = pagination.items
        total = pagination.total
        pages = pagination.pages

        return jsonify({
            "page": page,
            "per_page": per_page,
            "total": total,
            "pages": pages,
            "invoices": [
                {
                    "id": invoice.id,
                    "filename": invoice.filename,
                    "status": invoice.status,
                    "created_at": invoice.created_at.isoformat()
                }
                for invoice in invoices
            ]
        }), 200

invoice_list_bp.add_url_rule('/api/invoices/', view_func=InvoiceListAPI.as_view('invoice_list'), methods=['GET'])
