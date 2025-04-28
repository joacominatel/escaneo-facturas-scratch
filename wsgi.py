import eventlet
eventlet.monkey_patch()

import os
from dotenv import load_dotenv

# Cargar variables de entorno desde .env
load_dotenv()

from app import create_app
from app.core.extensions import socketio

# Crear la instancia de la aplicación Flask
app = create_app()

if __name__ == "__main__":
    print("Iniciando servidor de desarrollo SocketIO...")
    socketio.run(app, host='0.0.0.0', port=int(os.getenv('PORT', 8010)), debug=(os.getenv('FLASK_DEBUG') == 'True')) 