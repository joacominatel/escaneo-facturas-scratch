from app.core.extensions import db

class InvoiceData(db.Model):
    __tablename__ = 'invoices_data'
    __table_args__ = {'extend_existing': True}

    invoice_id = db.Column(db.Integer, primary_key=True)
    invoice_number = db.Column(db.String(255))
    amount_total = db.Column(db.Float)
    date = db.Column(db.String(255))
    bill_to = db.Column(db.String(255))
    currency = db.Column(db.String(50))
    payment_terms = db.Column(db.String(50))
    items = db.Column(db.JSON)
