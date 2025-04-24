from app.core.celery_app import celery
from app.core.extensions import db
from app.models.invoice import Invoice
from app.models.invoice_log import InvoiceLog
from app.services.openai_service import OpenAIService
from app.services.ocr_service import OCRService

@celery.task(name="process_invoice_task")
def process_invoice_task(invoice_id):
    from app import create_app
    app = create_app()

    with app.app_context():
        invoice = Invoice.query.get(invoice_id)
        if not invoice:
            return

        try:
            ocr_service = OCRService()
            raw_text = ocr_service.extract_text_from_pdf(invoice.file_path)

            db.session.add(InvoiceLog(invoice_id=invoice.id, event="ocr_extracted", details="OCR completado."))

            openai_service = OpenAIService()
            structured_data, raw_response = openai_service.extract_structured_data_and_raw(raw_text)
            print("Structured Data:", structured_data)
            print("Raw Response:", raw_response)

            invoice.preview_data = structured_data
            invoice.agent_response = raw_response
            invoice.status = "waiting_validation"

            db.session.add(invoice)
            db.session.add(InvoiceLog(invoice_id=invoice.id, event="processing_completed", details="Datos extraídos."))
            db.session.commit()

        except Exception as e:
            invoice.status = "failed"
            db.session.add(invoice)
            db.session.add(InvoiceLog(invoice_id=invoice.id, event="processing_failed", details=str(e)))
            db.session.commit()
        finally:
            db.session.remove()
            db.session.close()
