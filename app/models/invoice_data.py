from app.core.extensions import db
from sqlalchemy import text

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

    @staticmethod
    def create_view():
        # Definimos la consulta SQL de la vista
        view_query = """
        CREATE OR REPLACE VIEW invoices_data AS
        SELECT 
            i.id AS invoice_id,
            JSON_UNQUOTE(JSON_EXTRACT(i.final_data, '$.invoice_number')) AS invoice_number,
            JSON_EXTRACT(i.final_data, '$.amount_total') AS amount_total,
            JSON_UNQUOTE(JSON_EXTRACT(i.final_data, '$.date')) AS date,
            JSON_UNQUOTE(JSON_EXTRACT(i.final_data, '$.bill_to')) AS bill_to,
            JSON_UNQUOTE(JSON_EXTRACT(i.final_data, '$.currency')) AS currency,
            JSON_UNQUOTE(JSON_EXTRACT(i.final_data, '$.payment_terms')) AS payment_terms,
            JSON_EXTRACT(i.final_data, '$.items') AS items
        FROM invoices i
        WHERE i.final_data IS NOT NULL;
        """
        # Ejecutamos la consulta para crear la vista
        db.session.execute(text(view_query))
        db.session.commit()