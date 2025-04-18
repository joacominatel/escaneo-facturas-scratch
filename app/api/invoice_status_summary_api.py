from flask import Blueprint, jsonify
from flask.views import MethodView
from app.models.invoice_status_summary import InvoiceStatusSummary

invoice_summary_bp = Blueprint('invoice_summary_bp', __name__)

class InvoiceStatusSummaryAPI(MethodView):
    def get(self):
        results = InvoiceStatusSummary.query.all()

        summary = {r.status: r.total for r in results}

        return jsonify({
            "summary": summary
        }), 200

invoice_summary_bp.add_url_rule('/api/invoices/status-summary/', view_func=InvoiceStatusSummaryAPI.as_view('invoice_status_summary'), methods=['GET'])
