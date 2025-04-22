# 📚 Documentación de la API - Invoice Scanner App

Esta API permite gestionar la subida, validación, procesamiento y control de facturas escaneadas automáticamente mediante OCR y AI.

---

## 🌐 Endpoints disponibles

---

### 1. Subir archivos para procesamiento OCR
`POST /api/invoices/ocr`

**Descripción:**  
Permite subir uno o varios archivos (`.pdf` o `.zip`) para extraer el texto mediante Tesseract OCR y generar un resumen preliminar con OpenAI.

**Response de ejemplo:**

```json
[
  {
    "invoice_id": 12,
    "filename": "factura1.pdf",
    "summary": "Factura emitida por Empresa X el 01/04/2025...",
    "raw_text": "Texto OCR largo..."
  }
]
```
---
### 2. Confirmar procesamiento completo

`POST /api/invoices/<invoice_id>/confirm`

**Descripción:**
Confirma una factura ya validada y encola su procesamiento completo en Celery (estructura el JSON final con OpenAI).

**Response de ejemplo:**
```json
{
  "invoice_id": 12,
  "status": "processing",
  "message": "El procesamiento está en curso. Consultá luego el estado con GET /api/invoices/<id>"
}
```
---

### 3. Rechazar factura manualmente

`POST /api/invoices/<invoice_id>/reject`

**Descripción:**
Permite rechazar una factura si el resumen o el OCR no son correctos.

**Request Body esperado:**
```json
{
  "reason": "Texto OCR ilegible o resumen incorrecto."
}
```
**Response de ejemplo:**
```json
{
  "invoice_id": 12,
  "status": "rejected",
  "message": "Factura rechazada correctamente."
}
```
---
### 4. Reintentar procesamiento

`POST /api/invoices/<invoice_id>/retry`

**Descripción:**
Permite reenviar una factura rechazada o fallida para un nuevo procesamiento completo.

**Response de ejemplo:**
```json
{
  "invoice_id": 12,
  "status": "processing",
  "message": "Factura enviada nuevamente a procesamiento."
}
```
---
### 5. Ver estado y progreso en tiempo real

`GET /api/invoices/<invoice_id>/status`

**Descripción:**
Devuelve el estado actual de la factura, el porcentaje de progreso y el historial de eventos (logs).

**Response de ejemplo:**
```json
{
  "invoice_id": 12,
  "status": "processing",
  "message": "Procesando factura con inteligencia artificial.",
  "progress": 50,
  "log_events": [
    "ocr_extracted",
    "summary_created",
    "processing_started"
  ]
}
```
---
### 6. Listar facturas con filtros

`GET /api/invoices/`

**Descripción:**
Lista todas las facturas. Permite paginar y filtrar por status o op_number.

**Parámetros disponibles:**
- page (default 1)
- per_page (default 10)
- status (opcional: waiting_validation, processing, processed, etc.)
- op_number (opcional)

**Response de ejemplo:**
```json
{
  "page": 1,
  "per_page": 10,
  "total": 23,
  "pages": 3,
  "invoices": [
    {
      "id": 12,
      "filename": "factura1.pdf",
      "status": "processing",
      "created_at": "2025-04-18T10:22:11.123Z"
    }
  ]
}
```
---
### 7. Acceder a datos estructurados de facturas procesadas

`GET /api/invoices/data`

**Descripción:**
Devuelve facturas procesadas con todos los campos estructurados (invoice_number, amount_total, date, bill_to, advertising_numbers, etc).

**Parámetros disponibles:**
- page
- per_page
- op_number (opcional, filtra facturas que contengan un OP específico)

**Response de ejemplo:**
```json
{
  "page": 1,
  "per_page": 10,
  "total": 5,
  "pages": 1,
  "invoices": [
    {
      "invoice_id": 12,
      "invoice_number": "224577280",
      "amount_total": 774578.8,
      "date": "04-Feb-2020",
      "bill_to": "Carat Argentina S.A.",
      "currency": "ARS",
      "payment_terms": "NET 30",
      "advertising_numbers": [
        "OP443485",
        "OP443967",
        "OP443487",
        "OP443973"
      ],
      "items": [
        {
          "description": "Cruze_4_Learn_FB+G_VideoAd Views_Enero",
          "amount": 99669.55,
          "advertising_numbers": ["OP443485"]
        }
      ]
    }
  ]
}
```
---
### 8. Ver resumen de facturas por estado

`GET /api/invoices/status-summary/`

**Descripción:**
Devuelve el conteo de facturas agrupadas por su estado actual.

**Response de ejemplo:**
```json
{
  "summary": {
    "waiting_validation": 5,
    "processing": 2,
    "processed": 48,
    "failed": 1,
    "rejected": 3
  }
}
```
---

### 📡 WebSocket API

**Namespace:** `/invoices`
- Cada invoice_id tiene su propio canal privado: Escuchar eventos: invoice_progress_<invoice_id>

**Eventos emitidos:**
Evento | Progreso (%) | Descripción
`ocr_extracted` | 10% | OCR inicial extraído.
`summary_created` | 30% | Resumen generado para validación.
`processing_started` | 50% | Celery empezó procesamiento completo.
`processing_completed` | 100% | Procesamiento y extracción finalizada.
`processing_failed` | 100% | Error en procesamiento.
`rejected` | 100% | Factura rechazada manualmente.

**Ejemplo de mensaje WebSocket:**
```json
{
  "invoice_id": 12,
  "progress": 50,
  "event": "processing_started"
}
```
---