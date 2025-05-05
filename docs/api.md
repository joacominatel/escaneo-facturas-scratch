# API Documentation - Invoice Scanner App

This API allows managing the upload, processing, validation, and retrieval of scanned invoices using OCR and potentially AI for data extraction. It features asynchronous processing via Celery and real-time updates through WebSockets.

---

## Base URL

All API endpoints are relative to the application's base URL. For example, if your application is running at `http://localhost:8010`, the endpoints would be accessed like `http://localhost:8010/api/invoices/...`.

---

## Authentication

_(Note: Authentication details are not specified in the provided code snippets. This section should be updated if authentication/authorization mechanisms like API Keys or JWT Tokens are implemented.)_

---

## Invoice Status Lifecycle

Invoices progress through several statuses during their lifecycle:

1.  **`uploading` (Implicit):** File is received by the server.
2.  **`processing`:** File accepted, saved, initial `Invoice` record created. The `process_invoice_task` (Celery) is queued to perform OCR and AI extraction.
3.  **`waiting_validation`:** The background task (`process_invoice_task`) completed successfully. `preview_data` contains the extracted information, awaiting user review and action (confirm, reject, or update preview).
4.  **`processed`:** The invoice data (`preview_data`) has been confirmed via the `POST /confirm` endpoint. The data is copied to `final_data`, and processing for this invoice is considered complete.
5.  **`failed`:** The background task (`process_invoice_task`) encountered an error. Check `InvoiceLog` for details. The invoice can be retried via the `POST /retry` endpoint.
6.  **`rejected`:** The invoice was manually rejected via the `POST /reject` endpoint (typically from `waiting_validation`, `processing`, or `failed` states). It can be retried via the `POST /retry` endpoint.
7.  **`duplicated`:** The uploaded file was identified as a duplicate based on its filename during the initial upload (`POST /ocr`). No processing task is queued.

---

## Endpoints

---

### 1. Upload Invoices for Processing

`POST /api/invoices/ocr`

**Description:**
Uploads one or more invoice files (PDF, JPEG, PNG) for asynchronous processing. The system saves the file(s), attempts to create initial `Invoice` records, checks for duplicates by filename, and queues a background task (`process_invoice_task`) for valid, non-duplicate files. Records for valid uploads are initially set to `processing`.

**Important:** This endpoint returns quickly (202 Accepted) after queueing tasks. Actual processing happens asynchronously. Monitor invoice status via `GET /api/invoices/<id>` or WebSocket events.

**Request:**
- **Content-Type:** `multipart/form-data`
- **Body:**
    - `file`: One or more files. (Key name must be `file`)

**Allowed File Types:** `application/pdf`, `image/jpeg`, `image/png`.

**Response (Success - 202 Accepted):**
Returns a list indicating the outcome for each file.

```json
[
  {
    "invoice_id": 1, // ID assigned if accepted
    "filename": "factura_nueva.pdf",
    "status": "processing", // Initial status for accepted files
    "message": "Invoice is being processed automatically"
  },
  {
    "invoice_id": null, // No ID assigned for duplicates
    "filename": "factura_repetida.pdf",
    "status": "duplicated",
    "message": "Invoice was already processed previously (detected by name)."
  },
  {
    "filename": "documento_invalido.txt",
    "status": "error", // File-specific error
    "message": "File type not allowed: text/plain. Allowed: application/pdf, image/jpeg, image/png"
  }
]
```

**Response (Error - 400 Bad Request):**
If no files are provided.
```json
{
  "error": "No files found"
}
```

**Response (Error - 500 Internal Server Error):**
If a database error occurs during initial record creation for one or more files.
```json
{
  "error": "An error occurred while processing some files in the database.",
  "details": [ /* List potentially showing specific DB errors per file */ ]
}
```

---

### 2. List Invoices

`GET /api/invoices/`

**Description:**
Retrieves a paginated list of invoices. Supports filtering by status, searching by filename, and sorting.

**Query Parameters:**
- `page` (integer, optional, default: 1): Page number.
- `per_page` (integer, optional, default: 10, max: 100): Invoices per page.
- `status` (string, optional, multiple allowed): Filter by status(es) (e.g., `status=processing&status=failed`). See "Invoice Status Lifecycle" for valid statuses.
- `search` (string, optional): Case-insensitive search term for filename.
- `sort_by` (string, optional, default: `created_at`): Column to sort by (e.g., `id`, `filename`, `status`, `created_at`).
- `sort_order` (string, optional, default: `desc`): Sort order (`asc` or `desc`).

**Response (Success - 200 OK):**
Paginated list of invoices.

```json
{
  "page": 1,
  "per_page": 10,
  "total": 53, // Total invoices matching filters
  "pages": 6, // Total pages
  "invoices": [
    {
      "id": 15,
      "filename": "invoice_abc.pdf",
      "status": "processed",
      "created_at": "2024-07-28T15:30:00Z"
    },
    {
      "id": 14,
      "filename": "scan_xyz.png",
      "status": "waiting_validation",
      "created_at": "2024-07-28T14:20:15Z"
    }
    // ... more invoices
  ]
}
```

**Response (Error - 400 Bad Request):**
If `page` or `per_page` are invalid.
```json
{
  "error": "'page' and 'per_page' parameters must be integers."
}
```

**Response (Error - 500 Internal Server Error):**
If a database query fails.
```json
{
  "error": "Error querying the database"
}
```

---

### 3. Get Invoice Details

`GET /api/invoices/<int:invoice_id>`

**Description:**
Retrieves detailed information for a single invoice, including its current status, extracted data (`preview_data` or `final_data`), and potentially raw AI response (`agent_response`).

**Path Parameters:**
- `invoice_id` (integer, required): The ID of the invoice.

**Response (Success - 200 OK):**
```json
{
  "invoice_id": 15,
  "filename": "invoice_abc.pdf", // Added filename for context
  "status": "processed",
  "created_at": "2024-07-28T15:30:00Z", // Added timestamp
  "preview_data": { // Data extracted by OCR/AI, potentially edited by user
    "invoice_number": "INV-001-MODIFIED",
    "amount_total": 151.00,
    "date": "2024-07-20",
    // ... other fields
  },
  "final_data": { // Data after confirmation (copied from preview_data at time of confirm)
    "invoice_number": "INV-001-MODIFIED",
    "amount_total": 151.00,
    "date": "2024-07-20",
    // ... other fields
  },
  "agent_response": "Raw text response from the AI model during extraction." // Raw response may be included
}
```
*(Note: `preview_data` holds the current "working" data, modifiable via the PATCH endpoint. `final_data` is a snapshot of `preview_data` when the invoice was confirmed. `agent_response` stores the raw output from the AI service for debugging or reference.)*

**Response (Error - 404 Not Found):**
If the invoice ID does not exist.
```json
{
  "error": "Invoice not found"
}
```

---

### 4. Update Invoice Preview Data (Real-time Edit)

`PATCH /api/invoices/<int:invoice_id>/preview`

**Description:**
Updates the `preview_data` JSON object for an invoice, typically during manual validation (`waiting_validation` status). Uses database row-level locking to prevent conflicts. Emits a `invoice_preview_updated` WebSocket event upon successful update.

**Path Parameters:**
- `invoice_id` (integer, required): The ID of the invoice to update.

**Request Body:**
- **Content-Type:** `application/json`
- **Body:** Must contain the *entire* `preview_data` object with the desired changes. Fields not included in the request will be removed or defaulted.

```json
{
  "preview_data": {
    "invoice_number": "UPDATED-INV-001",
    "amount_total": 151.00,
    "date": "2024-07-21",
    "bill_to": "Client Corp Updated",
    "currency": "USD",
    "items": [ /* updated items array */ ]
    // ... include ALL fields required in the preview data structure
  }
}
```

**Response (Success - 200 OK):**
```json
{
  "message": "Datos de previsualización actualizados correctamente",
  "invoice_id": 15
}
```

**Response (Error - 400 Bad Request):**
- Invalid JSON body (`{"error": "La petición debe contener datos JSON"}`)
- Missing `preview_data` key (`{"error": "El cuerpo JSON debe contener el campo 'preview_data'"}`)
- `preview_data` is not a JSON object (`{"error": "'preview_data' debe ser un objeto JSON válido (dict)"}`)
- Cannot serialize `preview_data` (`{"error": "Error al serializar 'preview_data' a JSON: [details]"}`)

**Response (Error - 404 Not Found):**
If the invoice ID does not exist.
```json
{
  "error": "Factura con ID [invoice_id] no encontrada"
}
```

**Response (Error - 500 Internal Server Error):**
- Database update error (`{"error": "Error de base de datos al actualizar la factura"}`)
- Unexpected server error (`{"error": "Error interno inesperado del servidor"}`)

---

### 5. Confirm Invoice Data

`POST /api/invoices/<int:invoice_id>/confirm`

**Description:**
Confirms the `preview_data` for an invoice, typically when it's in the `waiting_validation` state. This action copies the current `preview_data` to `final_data` and changes the invoice status to `processed`.

**Path Parameters:**
- `invoice_id` (integer, required): The ID of the invoice to confirm.

**Response (Success - 200 OK):**
```json
{
  "invoice_id": 15,
  "status": "processed",
  "message": "Invoice confirmed and finalized successfully."
}
```

**Response (Error - 404 Not Found):**
If the invoice ID does not exist.
```json
{
  "error": "Invoice not found"
}
```

**Response (Error - 400 Bad Request):**
If the invoice has no `preview_data` (should not happen if status is `waiting_validation`).
```json
{
  "error": "No preview data to confirm"
}
```
If the invoice is not in `waiting_validation` status (or other allowed state if logic changes).
```json
// Example - Actual message might vary
{
  "error": "Invoice must be in 'waiting_validation' status to be confirmed. Current status: [current_status]"
}
```

---

### 6. Reject Invoice

`POST /api/invoices/<int:invoice_id>/reject`

**Description:**
Manually rejects an invoice. Allowed from states like `waiting_validation`, `processing`, or `failed`. Sets the status to `rejected`. A reason can optionally be provided. Rejected invoices can potentially be retried.

**Path Parameters:**
- `invoice_id` (integer, required): The ID of the invoice to reject.

**Request Body (optional):**
- **Content-Type:** `application/json`
```json
{
  "reason": "Data mismatch requiring re-scan." // Optional reason
}
```
(Default reason: "Manual rejection by the user.")

**Response (Success - 200 OK):**
```json
{
  "invoice_id": 16,
  "status": "rejected",
  "message": "Invoice rejected successfully."
}
```

**Response (Error - 404 Not Found):**
If the invoice ID does not exist.
```json
{
  "error": "Invoice not found"
}
```

**Response (Error - 400 Bad Request):**
If the invoice cannot be rejected from its current status (e.g., already `processed`).
```json
{
  "error": "Cannot reject an invoice with status [current_status]" // Specific allowed statuses depend on implementation (e.g., `waiting_validation`, `processing`, `failed`)
}
```

---

### 7. Retry Invoice Processing

`POST /api/invoices/<int:invoice_id>/retry`

**Description:**
Initiates reprocessing for an invoice that is currently in a `failed` or `rejected` state. Sets the status back to `processing` and re-queues the `process_invoice_task` Celery job.

**Path Parameters:**
- `invoice_id` (integer, required): The ID of the invoice to retry.

**Response (Success - 202 Accepted):**
Indicates the retry request was accepted. Processing will start asynchronously.
```json
{
  "invoice_id": 17,
  "status": "processing", // Status is immediately updated
  "message": "Invoice sent back for processing."
}
```

**Response (Error - 404 Not Found):**
If the invoice ID does not exist.
```json
{
  "error": "Invoice not found"
}
```

**Response (Error - 400 Bad Request):**
If the invoice is not in a retryable state (`failed` or `rejected`).
```json
{
  "error": "Only failed or rejected invoices can be retried. Current status: [current_status]"
}
```

---

### 8. Download Original Invoice File

`GET /api/invoices/<int:invoice_id>/download`

**Description:**
Downloads the original file that was uploaded for a specific invoice.

**Path Parameters:**
- `invoice_id` (integer, required): The ID of the invoice.

**Response (Success - 200 OK):**
- **Content-Type:** Original MIME type (e.g., `application/pdf`).
- **Content-Disposition:** `attachment; filename="[original_filename]"`
- **Body:** Raw file content.

**Response (Error - 404 Not Found):**
- Invoice ID not found (`{"error": "Invoice not found."}`)
- Invoice exists, but the file is missing on the server (`{"error": "File not found on the server."}`)

---

### 9. Get Invoice Status Summary

`GET /api/invoices/status-summary/`

**Description:**
Retrieves a count of invoices grouped by their current status. Useful for dashboard displays.

**Response (Success - 200 OK):**
```json
{
  "summary": {
    "processing": 5,
    "waiting_validation": 2,
    "processed": 48,
    "failed": 1,
    "rejected": 3,
    "duplicated": 10
    // Only statuses with counts > 0 are typically included.
  }
}
```
**Response (Error - 500 Internal Server Error):**
If there's an error querying the database.
```json
{
  "error": "Error querying database for summary"
}
```

---

### 10. Get Processed Invoice Data (Filtered)

`GET /api/invoices/data`

**Description:**
Retrieves structured data specifically from invoices that are fully `processed` (data resides in `final_data`). Supports pagination and filtering by specific data points within the extracted items (e.g., `op_number`).

**Query Parameters:**
- `page` (integer, optional, default: 1): Page number.
- `per_page` (integer, optional, default: 10): Items per page.
- `op_number` (string, optional): Filter results to include only processed invoices containing this `op_number` (advertising number) within their line items.

**Response (Success - 200 OK):**
Paginated list of final, structured invoice data.

```json
{
  "page": 1,
  "per_page": 10,
  "total": 25, // Total processed invoices matching the filter (if any)
  "invoices": [
    { // Represents data derived from Invoice.final_data
      "invoice_id": 15,
      "invoice_number": "FINV-2024-001",
      "amount_total": 1500.50,
      "date": "2024-07-15",
      "bill_to": "Customer A",
      "currency": "EUR",
      "payment_terms": "NET 30",
      "advertising_numbers": ["OP123", "OP456"], // Aggregated list
      "items": [
        {
          "description": "Service X",
          "amount": 1000.00,
          "advertising_numbers": ["OP123"]
        },
        {
          "description": "Service Y",
          "amount": 500.50,
          "advertising_numbers": ["OP456"]
        }
      ]
    }
    // ... more processed invoices
  ]
}
```
*(Note: The structure here reflects the expected format within `Invoice.final_data`)*

**Response (Error - 500 Internal Server Error):**
If there's an error querying the database.
```json
{
  "error": "Error querying processed invoice data"
}
```

---

## Company & Prompt Management

Endpoints for creating and managing companies and their associated AI prompts.

---

### 11. Create Company

`POST /api/companies/`

**Description:**
Creates a new company record. As part of the creation process, it automatically:
1. Creates a dedicated directory for the company's prompts (`app/prompts/companies/<company_id>/`).
2. Copies the base prompt layout (`app/prompts/prompt_layout.txt`) into the new directory as `prompt_v1.txt`.
3. Creates an initial `CompanyPrompt` record pointing to this new file, marking it as the default (`is_default=True`) with `version=1`.

**Request Body:**
- **Content-Type:** `application/json`
```json
{
  "name": "New Company Name"
}
```

**Response (Success - 201 Created):**
Returns the details of the newly created company.
```json
{
  "id": 1,
  "name": "New Company Name",
  "created_at": "2024-07-29T10:00:00.123Z",
  "updated_at": "2024-07-29T10:00:00.123Z"
  // "prompt_path" is not directly stored on the company model anymore
}
```

**Response (Error - 400 Bad Request):**
- Missing `name` field (`{"error": "El campo 'name' es requerido"}`)
- `name` is not a non-empty string (`{"error": "El campo 'name' debe ser una cadena no vacía"}`)

**Response (Error - 409 Conflict):**
If a company with the same name already exists.
```json
{
  "error": "La empresa 'Existing Company Name' ya existe."
}
```

**Response (Error - 500 Internal Server Error):**
- Error during service logic (e.g., base layout file not found) (`{"error": "Error del servicio: [details]"}`)
- Other unexpected errors (`{"error": "Ocurrió un error interno al crear la empresa"}`)

---

### 12. List Companies

`GET /api/companies/`

**Description:**
Retrieves a list of all registered companies.

**Response (Success - 200 OK):**
Returns an array of company objects.
```json
[
  {
    "id": 1,
    "name": "Company A",
    "created_at": "2024-07-29T10:00:00Z",
    "updated_at": "2024-07-29T10:00:00Z"
  },
  {
    "id": 2,
    "name": "Company B",
    "created_at": "2024-07-29T11:15:00Z",
    "updated_at": "2024-07-29T11:15:00Z"
  }
  // ... more companies
]
```

**Response (Error - 500 Internal Server Error):**
If a database query fails.
```json
{
  "error": "Ocurrió un error interno al listar las empresas"
}
```

---

### 13. Get Company Details

`GET /api/companies/<int:company_id>`

**Description:**
Retrieves the details of a specific company by its ID.

**Path Parameters:**
- `company_id` (integer, required): The ID of the company.

**Response (Success - 200 OK):**
Returns the company object.
```json
{
  "id": 1,
  "name": "Company A",
  "created_at": "2024-07-29T10:00:00Z",
  "updated_at": "2024-07-29T10:00:00Z"
}
```

**Response (Error - 404 Not Found):**
If the company ID does not exist.
```json
{
  "error": "Empresa no encontrada"
}
```

**Response (Error - 500 Internal Server Error):**
If a database query fails.
```json
{
  "error": "Ocurrió un error interno al obtener la empresa"
}
```

---

### 14. Update Company Default Prompt

`PUT /api/companies/<int:company_id>/prompt`

**Description:**
Updates the default prompt for a specific company. This process involves:
1. Determining the next available version number (based on the maximum existing version for the company).
2. Creating a new prompt file (e.g., `prompt_v2.txt`, `prompt_v3.txt`, etc.) in the company's prompt directory (`app/prompts/companies/<company_id>/`) with the provided content.
3. Updating the database: Marking the *previous* default `CompanyPrompt` record as `is_default=False` and creating a *new* `CompanyPrompt` record for the new file, marking it as `is_default=True` with the incremented version number.

**Path Parameters:**
- `company_id` (integer, required): The ID of the company whose prompt is being updated.

**Request Body:**
- **Content-Type:** `application/json`
```json
{
  "prompt_content": "This is the new, updated prompt text for the company..."
}
```

**Response (Success - 200 OK):**
Returns the details of the *newly created* `CompanyPrompt` record, which is now the default.
```json
{
  "id": 5, // ID of the new CompanyPrompt record
  "company_id": 1,
  "version": 2, // The new version number
  "prompt_path": "app/prompts/companies/1/prompt_v2.txt", // Path to the new file
  "is_default": true,
  "created_at": "2024-07-29T12:00:00.456Z"
}
```

**Response (Error - 400 Bad Request):**
- Missing `prompt_content` field (`{"error": "El campo 'prompt_content' es requerido en el JSON"}`)
- `prompt_content` is empty (`{"error": "El contenido del nuevo prompt no puede estar vacío."}`)

**Response (Error - 404 Not Found):**
If the specified `company_id` does not exist.
```json
{
  "error": "Error del servicio de prompts: Empresa con ID [company_id] no encontrada."
  // Note: Error message comes from PromptServiceError
}
```

**Response (Error - 500 Internal Server Error):**
- Error during prompt service logic (e.g., file I/O error, database update error) (`{"error": "Error del servicio de prompts: [details]"}`)
- Other unexpected errors (`{"error": "Ocurrió un error interno al actualizar el prompt"}`)

---

## 📡 Real-time Updates via WebSockets

The backend uses Flask-SocketIO to push real-time updates to connected clients, reducing the need for polling.

**Namespace:** `/invoices`

**Events:**

1.  **`invoice_status_update`**
    - **Trigger:** Emitted by the `db_session_context_with_event` context manager in `invoice_tasks.py` *after* an invoice's status is successfully committed to the database during background processing or via API actions like `confirm`, `reject`, `retry`.
    - **Description:** Notifies clients about changes in the overall status of any invoice.
    - **Data Payload:**
      ```json
      {
        "id": <integer>,       // ID of the updated invoice
        "status": "<string>",  // The new status (e.g., "processing", "waiting_validation", "failed")
        "filename": "<string>" // Filename for context
      }
      ```

2.  **`invoice_preview_updated`**
    - **Trigger:** Emitted specifically after a successful `PATCH /api/invoices/<int:invoice_id>/preview` request successfully updates the `preview_data` in the database.
    - **Description:** Signals that the editable `preview_data` for a *specific* invoice has changed, allowing interfaces editing that invoice to refresh.
    - **Emitted To:** A specific room: `invoice_<invoice_id>`. Clients interested in live edits for a particular invoice must join this room.
    - **Data Payload:**
      ```json
      {
        "id": <integer>,       // ID of the updated invoice
        "preview_data": { ... } // The complete, *new* preview_data object
      }
      ```

**Client-Side Handling (Conceptual):**

Clients (like the Next.js frontend) should connect to the `/invoices` namespace.

-   **Listening for General Updates:** Listen to `invoice_status_update` to update invoice lists or dashboards showing overall status changes.
-   **Listening for Specific Edits:** When a user opens an invoice for editing/validation:
    1.  The client should emit a `join` event to the server: `socket.emit('join', { room: 'invoice_123' });` (where 123 is the invoice ID).
    2.  The client should listen for `invoice_preview_updated` events. If received for the currently viewed invoice ID, update the displayed `preview_data` accordingly.
    3.  When the user navigates away, the client should emit a `leave` event: `socket.emit('leave', { room: 'invoice_123' });`.

```javascript
// Example using socket.io-client
import { io } from 'socket.io-client';

const socket = io('/invoices'); // Connect to the namespace

socket.on('connect', () => console.log('WebSocket connected'));
socket.on('disconnect', () => console.log('WebSocket disconnected'));

// General status updates
socket.on('invoice_status_update', (data) => {
  console.log('Status Update:', data);
  // Update UI for invoice list, dashboards etc. based on data.id and data.status
});

// Specific preview data updates (for the invoice being viewed/edited)
socket.on('invoice_preview_updated', (data) => {
  console.log('Preview Update:', data);
  const currentlyEditingInvoiceId = /* ... get ID from your app state ... */;
  if (data.id === currentlyEditingInvoiceId) {
    // Update the form/display with data.preview_data
  }
});

// Function to call when user starts editing invoice ID 123
function joinInvoiceRoom(invoiceId) {
  socket.emit('join', { room: `invoice_${invoiceId}` });
}

// Function to call when user stops editing invoice ID 123
function leaveInvoiceRoom(invoiceId) {
  socket.emit('leave', { room: `invoice_${invoiceId}` });
}
```

This WebSocket integration provides a responsive user experience, reflecting changes initiated by background processing or user actions in near real-time.

---