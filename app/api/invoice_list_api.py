from flask import Blueprint, jsonify, request
from flask.views import MethodView
from app.models.invoice import Invoice
from redis import Redis
import json
import hashlib
import os

invoice_list_bp = Blueprint('invoice_list_bp', __name__)
redis = Redis.from_url(os.getenv("REDIS_URL"))

class InvoiceListAPI(MethodView):
    def get(self):
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))
        status = request.args.get('status')
        search = request.args.get('search', '').strip()

        cache_key = f"invoice_search:{status}:{search}:{page}:{per_page}"
        cache_key = hashlib.sha256(cache_key.encode()).hexdigest()

        cached = redis.get(cache_key)
        if cached:
            return jsonify(json.loads(cached)), 200

        query = Invoice.query
        if status:
            query = query.filter_by(status=status)
        if search:
            query = query.filter(Invoice.filename.ilike(f"%{search}%"))

        pagination = query.order_by(Invoice.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)

        invoices = pagination.items
        total = pagination.total
        pages = pagination.pages

        result = {
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
        }

        redis.setex(cache_key, 15, json.dumps(result))  # TTL = 60s
        return jsonify(result), 200

invoice_list_bp.add_url_rule('/api/invoices/', view_func=InvoiceListAPI.as_view('invoice_list'), methods=['GET'])
