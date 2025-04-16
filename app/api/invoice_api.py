from flask import Blueprint, request, jsonify
from flask.views import MethodView
from app.core.extensions import db
from app.models.invoice import Invoice

invoice_bp = Blueprint('invoice_bp', __name__)

class InvoiceAPI(MethodView):
    def get(self):
        invoices = Invoice.query.all()
        return jsonify([invoice.to_dict() for invoice in invoices]), 200

    def post(self):
        data = request.json
        invoice = Invoice(filename=data.get('filename'))
        db.session.add(invoice)
        db.session.commit()

        return jsonify(invoice.to_dict()), 201

invoice_view = InvoiceAPI.as_view('invoice_api')
invoice_bp.add_url_rule('/', view_func=invoice_view, methods=['GET', 'POST'])
