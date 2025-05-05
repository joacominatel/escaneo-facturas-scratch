from app.models.company import Company
from app.models.invoice import Invoice

def get_company_name_from_invoice(invoice: Invoice) -> str:
    company = Company.query.get(invoice.company_id)
    return company.name if company else "Sin compañía"
