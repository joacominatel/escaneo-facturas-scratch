from app.core.extensions import db
from sqlalchemy import text

class InvoiceStatusSummary(db.Model):
    __tablename__ = 'invoice_status_summary'
    __table_args__ = {'extend_existing': True}

    status = db.Column(db.String(50), primary_key=True)
    total = db.Column(db.Integer)

    @staticmethod
    def create_view():
        # Definimos la consulta SQL de la vista
        view_query = """
        CREATE OR REPLACE VIEW invoice_status_summary AS
        SELECT 
            status,
            COUNT(*) AS total
        FROM invoices
        GROUP BY status;
        """
        # Ejecutamos la consulta para crear la vista
        db.session.execute(text(view_query))
        db.session.commit()