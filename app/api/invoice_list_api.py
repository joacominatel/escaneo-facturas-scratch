from flask import Blueprint, jsonify, request
from flask.views import MethodView
from app.models.invoice import Invoice
from sqlalchemy import asc, desc, inspect
from app.utils.get_company_name import get_company_name_from_invoice

invoice_list_bp = Blueprint('invoice_list_bp', __name__)

# Columnas permitidas para ordenar
ALLOWED_SORT_COLUMNS = {col.key for col in inspect(Invoice).c}

class InvoiceListAPI(MethodView):
    def get(self):
        try:
            page = int(request.args.get('page', 1))
            per_page = int(request.args.get('per_page', 10))
            if page <= 0: page = 1
            if per_page <= 0: per_page = 10
            # Limitar per_page si es necesario, ej. max 100
            per_page = min(per_page, 100)
        except ValueError:
            return jsonify({"error": "Los parámetros 'page' y 'per_page' deben ser números enteros."}), 400

        # Aceptar múltiples estados
        statuses = request.args.getlist('status') # Devuelve una lista
        search = request.args.get('search', '').strip()
        sort_by = request.args.get('sort_by', 'created_at')
        sort_order = request.args.get('sort_order', 'desc').lower()

        # Validar sort_by
        if sort_by not in ALLOWED_SORT_COLUMNS:
            sort_by = 'created_at' # Volver al default si no es válido

        # Validar sort_order
        if sort_order not in ['asc', 'desc']:
            sort_order = 'desc' # Volver al default si no es válido

        query = Invoice.query

        # Filtrar por múltiples estados si se proporcionan
        if statuses:
            # valid_statuses = [s for s in statuses if s in Invoice.VALID_STATUSES] # Ejemplo
            # if valid_statuses:
            #    query = query.filter(Invoice.status.in_(valid_statuses))
            query = query.filter(Invoice.status.in_(statuses))

        if search:
            # Filtrar por nombre de archivo (case-insensitive)
            query = query.filter(Invoice.filename.ilike(f"%{search}%"))

        # Aplicar ordenación
        sort_column = getattr(Invoice, sort_by)
        order_func = desc if sort_order == "desc" else asc
        query = query.order_by(order_func(sort_column))

        try:
            pagination = query.paginate(page=page, per_page=per_page, error_out=False)
            for invoice in pagination.items:
                invoice.company_name = get_company_name_from_invoice(invoice)
        except Exception as e:
            # Loguear el error e
            return jsonify({"error": "Error al consultar la base de datos"}), 500

        result = {
            "page": pagination.page, # Usar el valor de la paginación por si se ajustó
            "per_page": pagination.per_page,
            "total": pagination.total,
            "pages": pagination.pages,
            "invoices": [
                {
                    "id": invoice.id,
                    "filename": invoice.filename,
                    "status": invoice.status,
                    "company_name": invoice.company_name,
                    "created_at": invoice.created_at.isoformat() if invoice.created_at else None,
                }
                for invoice in pagination.items
            ]
        }

        return jsonify(result), 200

invoice_list_bp.add_url_rule('/api/invoices/', view_func=InvoiceListAPI.as_view('invoice_list'), methods=['GET'])
