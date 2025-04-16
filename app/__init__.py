from flask import Flask
from app.core.config import Config
from app.core.extensions import init_extensions
from app.api.invoice_api import invoice_bp
from app.api.invoice_confirm_api import invoice_confirm_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Inicializar extensiones
    init_extensions(app)

    # Importar modelos aquí para que Flask-Migrate los detecte
    from app.models import Invoice
    from app.models import InvoiceLog

    # Registrar Blueprints
    app.register_blueprint(invoice_bp, url_prefix='/api/invoices')
    app.register_blueprint(invoice_confirm_bp)

    return app
