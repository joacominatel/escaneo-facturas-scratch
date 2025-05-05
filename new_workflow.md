## 🔁 Flujo de prompts por empresa

1. Al crear empresa → se copia el `prompt_layout.txt` a un nuevo .txt para esa empresa.
2. Se guarda la ruta en `companies.prompt_path` y también se crea la primera entrada en `company_prompts`.
3. El usuario puede editar desde el frontend:
    - Modo asistido (campos)
    - Modo avanzado (textarea)
4. En cada factura, si tiene `company_id`, se usa el prompt correspondiente.
5. Si no, se usa el `prompt_layout.txt` base.

## Problema principal:
Esto no va a ser tan facil por el siguiente motivo: mi estructura actual de la db. A ver tenemos una ventaja y una desventaja.

En el Modelo `invoices.py`, tenemos la **ventaja** de que los datos de la factura se guardan en formato JSON, entonces no tenemos problema si algo cambia, porque simplemente el campo recibe un JSON estructurado (col preview_data y col final_data)

El problema esta en la view (`invoices_data`) que usa el frontend para mostrar los datos de forma mas sencilla:
**MODELO DE VIEW:**
```
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
```

Que se me ocurrio a mi ? Agregar un campo de "campos personalizados" o algo parecido.
Quiero que primero funcione todo el sql para despues interpretarlo mejor.