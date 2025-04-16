from app.core.extensions import db
from datetime import datetime

class InvoiceLog(db.Model):
    __tablename__ = 'invoice_logs'

    id = db.Column(db.Integer, primary_key=True)
    invoice_id = db.Column(db.Integer, db.ForeignKey('invoices.id'), nullable=False)
    event = db.Column(db.String(255), nullable=False)  # Ej: 'ocr_extracted', 'summary_created', etc
    details = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    invoice = db.relationship("Invoice", backref="logs")
