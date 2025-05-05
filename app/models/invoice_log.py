from app.core.extensions import db
from datetime import datetime
import json

class LogLevel:
    DEBUG = "debug"
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"

class LogCategory:
    PROCESS = "process"      # Procesos principales como OCR, extracción
    SYSTEM = "system"        # Eventos del sistema
    DATABASE = "database"    # Operaciones de base de datos
    API = "api"              # Llamadas API
    USER = "user"            # Acciones del usuario
    WORKER = "worker"        # Tareas del worker (Celery)
    SECURITY = "security"    # Eventos de seguridad

class InvoiceLog(db.Model):
    __tablename__ = 'invoice_logs'

    id = db.Column(db.Integer, primary_key=True)
    invoice_id = db.Column(db.Integer, db.ForeignKey('invoices.id'), nullable=False)
    event = db.Column(db.String(255), nullable=False)  # Ej: 'ocr_extracted', 'summary_created', etc
    level = db.Column(db.String(20), nullable=False, default=LogLevel.INFO)  # debug, info, warning, error, critical
    category = db.Column(db.String(50), nullable=False, default=LogCategory.PROCESS)  # process, system, database, api, user, worker, security
    origin = db.Column(db.String(100))  # Servicio o componente que generó el log
    details = db.Column(db.Text)  # Detalles textuales
    extra_data = db.Column(db.Text)  # Datos adicionales en formato JSON
    ip_address = db.Column(db.String(45))  # Para logs relacionados con API
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    invoice = db.relationship("Invoice", backref="logs")

    @property
    def extra(self):
        """Devuelve los datos extra como un diccionario"""
        if not self.extra_data:
            return {}
        try:
            return json.loads(self.extra_data)
        except:
            return {}

    @extra.setter
    def extra(self, data):
        """Guarda los datos extra como JSON"""
        if data is None:
            self.extra_data = None
        else:
            self.extra_data = json.dumps(data)
