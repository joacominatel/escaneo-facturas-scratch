from flask import Blueprint, jsonify, request
from flask.views import MethodView
from app.models.invoice_data import InvoiceData

invoice_data_bp = Blueprint('invoice_data_bp', __name__)

class InvoiceDataAPI(MethodView):
    def get(self):
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))

        query = InvoiceData.query

        invoices = query.paginate(page=page, per_page=per_page, error_out=False)

        result = []
        for inv in invoices.items:
            result.append({
                "invoice_id": inv.invoice_id,
                "invoice_number": inv.invoice_number,
                "amount_total": inv.amount_total,
                "date": inv.date,
                "bill_to": inv.bill_to,
                "currency": inv.currency,
                "payment_terms": inv.payment_terms,
                "items": inv.items,
                "custom_fields": inv.custom_fields,
                "company_id": inv.company_id
            })

        return jsonify({
            "page": page,
            "per_page": per_page,
            "total": len(result),
            "invoices": result
        }), 200

invoice_data_bp.add_url_rule('/api/invoices/data', view_func=InvoiceDataAPI.as_view('invoice_data'), methods=['GET'])
