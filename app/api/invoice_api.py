from flask import Blueprint, request, jsonify
from flask.views import MethodView

invoice_bp = Blueprint('invoice_bp', __name__)

class InvoiceAPI(MethodView):
    def get(self):
        return jsonify({"message": "API de Facturas lista para procesar documentos."}), 200

    def post(self):
        data = request.json
        return jsonify({"recibido": data}), 201

# Registrar endpoints con clases
invoice_view = InvoiceAPI.as_view('invoice_api')
invoice_bp.add_url_rule('/', view_func=invoice_view, methods=['GET', 'POST'])
