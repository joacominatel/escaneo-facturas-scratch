from flask import Blueprint, jsonify, request
from flask.views import MethodView
from app.models.invoice_status_summary import InvoiceStatusSummary
from app.models.invoice import Invoice
from app.core.extensions import db
from sqlalchemy import func, cast, Date
from datetime import datetime

invoice_summary_bp = Blueprint('invoice_summary_bp', __name__)

class InvoiceStatusSummaryAPI(MethodView):
    def get(self):
        start_date_str = request.args.get('start_date')
        end_date_str = request.args.get('end_date')

        query = db.session.query(
            Invoice.status,
            func.count(Invoice.id).label('total')
        )

        if start_date_str:
            try:
                start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
                query = query.filter(cast(Invoice.created_at, Date) >= start_date)
            except ValueError:
                return jsonify({"error": "Formato de start_date inválido. Usar YYYY-MM-DD."}), 400
        
        if end_date_str:
            try:
                end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
                query = query.filter(cast(Invoice.created_at, Date) <= end_date)
            except ValueError:
                return jsonify({"error": "Formato de end_date inválido. Usar YYYY-MM-DD."}), 400

        results = query.group_by(Invoice.status).all()
        
        summary = {r.status: r.total for r in results}

        return jsonify({
            "summary": summary
        }), 200

invoice_summary_bp.add_url_rule('/api/invoices/status-summary/', view_func=InvoiceStatusSummaryAPI.as_view('invoice_status_summary'), methods=['GET'])
