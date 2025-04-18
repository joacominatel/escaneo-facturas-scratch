from app.core.extensions import db

class InvoiceStatusSummary(db.Model):
    __tablename__ = 'invoice_status_summary'
    __table_args__ = {'extend_existing': True}

    status = db.Column(db.String(50), primary_key=True)
    total = db.Column(db.Integer)
