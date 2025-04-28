from flask import Blueprint, request, jsonify
from app.core.extensions import db, socketio
from app.models.invoice import Invoice
from app.models.invoice_log import InvoiceLog
from sqlalchemy.exc import SQLAlchemyError
import json
import datetime

# Blueprint para la API de actualización de preview
invoice_preview_update_bp = Blueprint('invoice_preview_update_api', __name__, url_prefix='/api/invoices')

@invoice_preview_update_bp.route('/<int:invoice_id>/preview', methods=['PATCH'])
def update_invoice_preview(invoice_id):
    """
    Actualiza el campo preview_data de una factura específica.
    Notifica a los clientes conectados a través de WebSockets.
    """
    if not request.is_json:
        return jsonify({"error": "La petición debe contener datos JSON"}), 400

    data = request.get_json()
    new_preview_data = data.get('preview_data')

    if new_preview_data is None:
        return jsonify({"error": "El cuerpo JSON debe contener el campo 'preview_data'"}), 400

    # Validar si preview_data es un diccionario (objeto JSON)
    # Asumimos que get_json ya lo parsea a un dict si es JSON válido.
    if not isinstance(new_preview_data, dict):
         # Si se envió como string, intentar parsearlo. Si no, es inválido.
         if isinstance(new_preview_data, str):
             try:
                 new_preview_data = json.loads(new_preview_data)
             except json.JSONDecodeError:
                  return jsonify({"error": "'preview_data' debe ser un objeto JSON válido (dict)"}), 400
         else:
             return jsonify({"error": "'preview_data' debe ser un objeto JSON válido (dict)"}), 400


    session = db.session()
    try:
        # Usar with_for_update() para bloquear la fila durante la transacción
        # Requiere que la transacción se inicie antes de la consulta
        invoice = session.query(Invoice).filter_by(id=invoice_id).with_for_update().first()

        if not invoice:
            session.rollback() # Liberar el bloqueo si no se encontró
            return jsonify({"error": f"Factura con ID {invoice_id} no encontrada"}), 404

        # Actualizar el campo preview_data.
        # Asignar el diccionario directamente (asumiendo columna JSON/JSONB nativo)
        try:
            invoice.preview_data = new_preview_data # Asignar el dict directamente
        except Exception as e: # Captura errores más generales si la asignación falla
            session.rollback()
            # Puedes loggear el error específico si quieres más detalle
            print(f"Error al asignar preview_data (tipo {type(new_preview_data)}): {e}")
            return jsonify({"error": f"Error al procesar 'preview_data'"}), 400

        # Actualizar timestamp
        invoice.updated_at = datetime.datetime.utcnow()

        # Añadir log
        log_entry = InvoiceLog(
            invoice_id=invoice.id,
            event="preview_data_updated",
            details="Datos de previsualización actualizados manualmente."
        )
        session.add(log_entry)

        # Commit para guardar los cambios y liberar el bloqueo
        session.commit()

        # Emitir evento WebSocket DESPUÉS del commit exitoso
        try:
            # Enviamos los datos actualizados para que la UI los use
            # Usar un 'room' específico para esta factura es más eficiente
            room_name = f'invoice_{invoice_id}'
            socketio.emit('invoice_preview_updated', {
                'id': invoice.id,
                'preview_data': new_preview_data # Enviamos el dict parseado
            }, namespace='/invoices', room=room_name)
            print(f"Evento SocketIO 'invoice_preview_updated' emitido para factura {invoice.id} en room {room_name}")
        except Exception as socket_err:
            # El fallo en SocketIO no debería revertir la transacción
            print(f"Error al emitir evento SocketIO tras actualización de preview: {socket_err}")

        return jsonify({
            "message": "Datos de previsualización actualizados correctamente",
            "invoice_id": invoice.id
        }), 200

    except SQLAlchemyError as e:
        session.rollback()
        print(f"Error SQLAlchemy al actualizar preview_data para factura {invoice_id}: {e}")
        # Podríamos querer distinguir errores (ej. deadlock vs otros) pero empezamos genérico
        return jsonify({"error": "Error de base de datos al actualizar la factura"}), 500
    except Exception as e:
        session.rollback()
        print(f"Error inesperado al actualizar preview_data para factura {invoice_id}: {e}")
        return jsonify({"error": "Error interno inesperado del servidor"}), 500
    finally:
        # La sesión se cierra automáticamente al salir del 'try...except...finally'
        # si se usa el patrón de session scope, o explícitamente si no.
        # Aquí asumimos un manejo estándar donde la sesión se maneja por request.
        # Si no, añadir session.close() aquí.
        pass 