from flask import Flask
from app.core.config import Config
from app.core.extensions import init_extensions
from app.api.invoice_api import invoice_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Inicializar extensiones
    init_extensions(app)

    # Importar modelos aquí para que Flask-Migrate los detecte
    from app.models import Invoice

    # Registrar Blueprints
    app.register_blueprint(invoice_bp, url_prefix='/api/invoices')

    return app
