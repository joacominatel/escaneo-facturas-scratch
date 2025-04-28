from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_socketio import SocketIO

cors = CORS()
db = SQLAlchemy()
migrate = Migrate()
# Habilitar logger de engineio para depuración detallada de SocketIO
socketio = SocketIO(cors_allowed_origins="*", engineio_logger=True, logger=True)

def init_extensions(app):
    cors.init_app(app, origins=["*"])
    db.init_app(app)
    migrate.init_app(app, db)
    socketio.init_app(app, message_queue=app.config.get('SOCKETIO_MESSAGE_QUEUE')) # <- Restaurado
    # socketio.init_app(app) # <- Comentado
