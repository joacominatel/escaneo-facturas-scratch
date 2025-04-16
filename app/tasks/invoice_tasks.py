from app.core.celery_app import celery
from app.core.extensions import db
from app.models.invoice import Invoice
from app.models.invoice_log import InvoiceLog
from app.services.openai_service import OpenAIService

@celery.task(name="process_invoice_task")
def process_invoice_task(invoice_id):
    from app import create_app
    app = create_app()

    with app.app_context():
        invoice = Invoice.query.get(invoice_id)
        if not invoice:
            return

        log = InvoiceLog.query.filter_by(invoice_id=invoice.id, event="ocr_extracted").first()
        if not log:
            return

        try:
            openai_service = OpenAIService()
            structured_data = openai_service.extract_structured_data(log.details)

            invoice.final_data = structured_data
            invoice.status = "processed"

            db.session.add(invoice)
            db.session.add(InvoiceLog(invoice_id=invoice.id, event="final_processing", details=str(structured_data)))
            db.session.commit()
        except Exception as e:
            invoice.status = "failed"
            db.session.add(invoice)
            db.session.add(InvoiceLog(invoice_id=invoice.id, event="processing_failed", details=str(e)))
            db.session.commit()
        finally:
            db.session.remove()
            db.session.close()