# API Documentation

## POST /api/invoices/ocr

Performs Optical Character Recognition (OCR) on one or more invoice files.

**Method:** `POST`

**Endpoint:** `/api/invoices/ocr`

**Request Body:** `multipart/form-data`

**Parameters:**

*   `file`: The invoice file(s) to process. You can send multiple files by including multiple `file` parts in the request.

**Example Request (using cURL):**

```bash
curl -X POST http://localhost:8010/api/invoices/ocr \
    -F "file=@/path/to/your/invoice1.pdf" \
    -F "file=@/path/to/your/invoice2.jpg"
```

**Response:**

*   **Success (200 OK):** Returns a JSON object containing the extracted data from the invoices. (Details of the response structure should be added here).
*   **Error:** Returns an error message indicating what went wrong (e.g., file format not supported, OCR failure).

---
*(More routes will be added here)*