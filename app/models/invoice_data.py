from app.core.extensions import db
from sqlalchemy import text, Column, Integer, String, Float, JSON

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
    company_id = db.Column(db.Integer)
    custom_fields = db.Column(db.JSON)

    @staticmethod
    def create_view():
        # Definimos la consulta SQL para eliminar la vista/tabla si existe
        drop_query = text("""
        DROP TABLE IF EXISTS invoices_data;
        """)
        # Ejecutamos la consulta para eliminar la vista
        db.session.execute(drop_query)
        db.session.commit()

        # Definimos la consulta SQL de la vista actualizada
        view_query = text("""
        CREATE OR REPLACE VIEW invoices_data AS
        SELECT 
            i.id AS invoice_id,
            i.company_id,
            JSON_UNQUOTE(JSON_EXTRACT(i.final_data, '$.invoice_number')) AS invoice_number,
            JSON_EXTRACT(i.final_data, '$.amount_total') AS amount_total,
            JSON_UNQUOTE(JSON_EXTRACT(i.final_data, '$.date')) AS date,
            JSON_UNQUOTE(JSON_EXTRACT(i.final_data, '$.bill_to')) AS bill_to,
            JSON_UNQUOTE(JSON_EXTRACT(i.final_data, '$.currency')) AS currency,
            JSON_UNQUOTE(JSON_EXTRACT(i.final_data, '$.payment_terms')) AS payment_terms,
            JSON_EXTRACT(i.final_data, '$.items') AS items,
            JSON_REMOVE(i.final_data, 
                        '$.invoice_number', 
                        '$.amount_total', 
                        '$.date', 
                        '$.bill_to', 
                        '$.currency', 
                        '$.payment_terms', 
                        '$.items'
            ) AS custom_fields
        FROM invoices i
        WHERE i.final_data IS NOT NULL;
        """)
        # Ejecutamos la consulta para crear la vista
        db.session.execute(view_query)
        db.session.commit()