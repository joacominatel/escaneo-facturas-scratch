from flask import Blueprint, jsonify, request
from app.models.invoice import Invoice
from app.core.extensions import db
from sqlalchemy import func, cast, Date
from datetime import datetime, timedelta
from flask.views import MethodView

invoice_trends_bp = Blueprint('invoice_trends_bp', __name__)

class InvoiceTrendsAPI(MethodView):
    def get(self):
        days_ago_str = request.args.get('days_ago')
        start_date_str = request.args.get('start_date')
        end_date_str = request.args.get('end_date')
        target_status = request.args.get('status', 'processed') # Por defecto 'processed'

        today = datetime.utcnow().date()
        
        if days_ago_str:
            try:
                days_ago = int(days_ago_str)
                # start_date se calcula incluyendo el día actual, por lo que restamos days_ago - 1
                # Por ejemplo, para 7 días, queremos hoy y los 6 días anteriores.
                start_date = today - timedelta(days=days_ago -1) 
                end_date = today
            except ValueError:
                return jsonify({"error": "Formato de days_ago inválido. Debe ser un número."}), 400
        else:
            if start_date_str:
                try:
                    start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
                except ValueError:
                    return jsonify({"error": "Formato de start_date inválido. Usar YYYY-MM-DD."}), 400
            else:
                # Por defecto, los últimos 7 días si no se especifica nada más
                start_date = today - timedelta(days=6)


            if end_date_str:
                try:
                    end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
                except ValueError:
                    return jsonify({"error": "Formato de end_date inválido. Usar YYYY-MM-DD."}), 400
            else:
                end_date = today
        
        if start_date > end_date:
            return jsonify({"error": "start_date no puede ser posterior a end_date."}), 400

        # Construir la consulta base
        query = db.session.query(
            cast(Invoice.created_at, Date).label('date'),
            func.count(Invoice.id).label('count')
        ).filter(
            Invoice.status == target_status
        ).filter(
            cast(Invoice.created_at, Date) >= start_date
        ).filter(
            cast(Invoice.created_at, Date) <= end_date
        ).group_by(
            cast(Invoice.created_at, Date)
        ).order_by(
            cast(Invoice.created_at, Date)
        )

        results = query.all()

        # Crear un diccionario con todos los días en el rango, inicializados a 0
        # Esto asegura que los días sin facturas también aparezcan en el resultado.
        trend_data_map = {}
        current_date = start_date
        while current_date <= end_date:
            trend_data_map[current_date.isoformat()] = 0
            current_date += timedelta(days=1)
        
        for r in results:
            trend_data_map[r.date.isoformat()] = r.count
            
        # Convertir el mapa a la lista de objetos deseada
        trend_data_list = [{"date": date_str, "count": count_val} for date_str, count_val in trend_data_map.items()]
        # Ordenar por fecha, ya que el dict no garantiza orden en versiones antiguas de Python (aunque aquí debería estarlo por cómo se llena)
        trend_data_list.sort(key=lambda x: x['date'])


        return jsonify({
            "trend_data": trend_data_list,
            "status_queried": target_status,
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat()
        }), 200

# Registrar la vista
# Es importante importar MethodView aquí si no está ya
from flask.views import MethodView
invoice_trends_bp.add_url_rule('/api/invoices/trends/', view_func=InvoiceTrendsAPI.as_view('invoice_trends_api'), methods=['GET'])