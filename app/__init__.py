from flask import Flask
from app.core.config import Config
from app.core.extensions import init_extensions
from app.api.invoice_api import invoice_bp
from app.api.invoice_confirm_api import invoice_confirm_bp
from app.api.invoice_reject_api import invoice_reject_bp
from app.api.invoice_list_api import invoice_list_bp
from app.api.invoice_retry_api import invoice_retry_bp
from app.api.invoice_status_summary_api import invoice_summary_bp
from app.api.invoice_data_api import invoice_data_bp

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
    app.register_blueprint(invoice_reject_bp)
    app.register_blueprint(invoice_list_bp)
    app.register_blueprint(invoice_retry_bp)
    app.register_blueprint(invoice_summary_bp)
    app.register_blueprint(invoice_data_bp)

    return app
