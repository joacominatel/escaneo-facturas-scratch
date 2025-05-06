from flask import Blueprint, jsonify, request
from flask.views import MethodView
from app.models.invoice_data import InvoiceData

invoice_data_bp = Blueprint('invoice_data_bp', __name__)

class InvoiceDataAPI(MethodView):
    def get(self):
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))
        op_number = request.args.get('op_number')

        query = InvoiceData.query

        invoices = query.paginate(page=page, per_page=per_page, error_out=False)

        result = []
        for inv in invoices.items:
            advertising_numbers = set()

            if inv.items:
                for item in inv.items:
                    ops = item.get('advertising_numbers', [])
                    advertising_numbers.update(ops)

            advertising_numbers = list(advertising_numbers)

            # Si el filtro op_number existe, chequeamos
            if op_number:
                if op_number.upper() not in advertising_numbers:
                    continue  # saltamos esta factura

            result.append({
                "invoice_id": inv.invoice_id,
                "invoice_number": inv.invoice_number,
                "amount_total": inv.amount_total,
                "date": inv.date,
                "bill_to": inv.bill_to,
                "currency": inv.currency,
                "payment_terms": inv.payment_terms,
                "advertising_numbers": advertising_numbers,
                "items": inv.items,
                "custom_fields": inv.custom_fields
            })

        return jsonify({
            "page": page,
            "per_page": per_page,
            "total": len(result),
            "invoices": result
        }), 200

invoice_data_bp.add_url_rule('/api/invoices/data', view_func=InvoiceDataAPI.as_view('invoice_data'), methods=['GET'])
