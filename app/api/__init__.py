from .company_api import company_bp
from .invoice_api import invoice_bp
from .invoice_confirm_api import invoice_confirm_bp
from .invoice_data_api import invoice_data_bp
from .invoice_download_api import invoice_download_bp
from .invoice_list_api import invoice_list_bp
from .invoice_preview_update_api import invoice_preview_update_bp
from .invoice_reject_api import invoice_reject_bp
from .invoice_retry_api import invoice_retry_bp
from .invoice_status_summary_api import invoice_summary_bp
from .invoice_trends_api import invoice_trends_bp

# all blueprints + url_prefix
all_blueprints = {
    'company': {
        'blueprints': [company_bp]
    },
    'invoice': {
        'blueprints': [invoice_confirm_bp, invoice_reject_bp, invoice_list_bp, invoice_retry_bp, invoice_summary_bp, invoice_data_bp, invoice_download_bp, invoice_preview_update_bp]
    },
    'invoice_trends': {
        'blueprints': [invoice_trends_bp]
    },
    'invoice_bp': {
        'blueprints': [invoice_bp],
        'url_prefix': '/api'
    }
}