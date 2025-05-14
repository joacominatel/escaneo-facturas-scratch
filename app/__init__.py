from flask import Flask, request
from app.core.config import Config
from app.core.extensions import init_extensions, db, socketio
from app.api import *

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    print(f"DEBUG: DATABASE_URL Cargada: {Config.SQLALCHEMY_DATABASE_URI}")

    # Inicializar extensiones
    init_extensions(app)

    @socketio.on('connect', namespace='/invoices')
    def handle_invoice_connect():
        print(f"Cliente conectado al namespace /invoices: {request.sid}")
        # No retornar False ni lanzar excepciones aquí
        pass

    @socketio.on('disconnect', namespace='/invoices')
    def handle_invoice_disconnect():
        print(f"Cliente desconectado del namespace /invoices: {request.sid}")

    # Importar modelos aquí para que Flask-Migrate los detecte
    from app.models import Invoice, InvoiceLog, Company, CompanyPrompt

    # Views
    from app.models import InvoiceData, InvoiceStatusSummary

    with app.app_context():
        db.create_all()
        db.session.commit()

        # Crear vistas si no existen
        InvoiceData.create_view()
        InvoiceStatusSummary.create_view()
        db.session.commit()

    # Registrar Blueprints
    app.register_blueprint(invoice_bp, url_prefix='/api')
    app.register_blueprint(invoice_confirm_bp)
    app.register_blueprint(invoice_reject_bp)
    app.register_blueprint(invoice_list_bp)
    app.register_blueprint(invoice_retry_bp)
    app.register_blueprint(invoice_summary_bp)
    app.register_blueprint(invoice_data_bp)
    app.register_blueprint(invoice_download_bp)
    app.register_blueprint(invoice_preview_update_bp)
    app.register_blueprint(company_bp)
    app.register_blueprint(invoice_trends_bp)
    
    return app
