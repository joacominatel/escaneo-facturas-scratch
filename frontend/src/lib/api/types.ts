/* eslint-disable @typescript-eslint/no-explicit-any */
export type InvoiceStatus = 
  | "processing" 
  | "waiting_validation" 
  | "processed" 
  | "failed" 
  | "rejected" 
  | "duplicated"
  | "pending_processing"

export interface InvoiceListItem {
  id: number
  filename: string
  status: InvoiceStatus
  created_at: string // ISO 8601 date string
}

export interface PaginatedInvoices<T> {
  page: number
  per_page: number
  total: number
  pages: number // Note: Documentation uses 'pages', current api.ts uses 'total_pages' - check consistency with backend. Assuming 'pages'.
  invoices: T[]
}

// Detailed data structure for a single invoice (GET /api/invoices/<id>)
export interface InvoiceDetail {
  invoice_id: number
  status: InvoiceStatus
  final_data?: Record<string, any> // Define more specific type if known
  preview?: Record<string, any> // Cambiado de preview_data a preview para que coincida con el API
}

// Structure for the status summary (GET /api/invoices/status-summary/)
export interface InvoiceStatusSummary {
  summary: Partial<Record<InvoiceStatus, number>> // Use Partial because not all statuses might be present
}

// Structure for an item within a processed invoice's data (used in GET /api/invoices/data)
export interface ProcessedInvoiceItem {
  description: string
  amount: number
}

// Structure for a processed invoice's data (GET /api/invoices/data)
export interface ProcessedInvoiceData {
  invoice_id: number
  invoice_number: string
  amount_total: number
  date: string // ISO 8601 date string?
  bill_to: string
  currency: string
  payment_terms?: string // Optional based on documentation example
  items: ProcessedInvoiceItem[]
}

// Structure for the response of the upload endpoint (POST /api/invoices/ocr)
export interface UploadResponseItem {
  invoice_id: number | null
  filename: string
  status: InvoiceStatus | "error" // Can be 'error' during upload failure
  message: string
}

// Structure for API error responses
export interface ApiErrorResponse {
  error: string
  details?: any // Could be an array or object depending on the error
}

// Generic structure for simple success responses (e.g., confirm, reject, retry)
export interface SimpleSuccessResponse {
  invoice_id: number
  status: InvoiceStatus
  message: string
}

// Options for fetchInvoiceHistory (maps to GET /api/invoices/ query params)
export interface FetchInvoiceHistoryOptions {
  page?: number
  perPage?: number
  status?: InvoiceStatus | InvoiceStatus[] // Allow single or multiple statuses
  search?: string
  // dateFrom?: string // Not in current api.ts, but could be added based on docs
  // dateTo?: string   // Not in current api.ts, but could be added based on docs
  sortBy?: keyof InvoiceListItem | string // Allow known keys or custom strings
  sortOrder?: "asc" | "desc"
}

/**
 * Representa una empresa en el sistema.
 */
export interface Company {
  id: number;
  name: string;
  created_at: string | null; // ISO 8601 date string or null
  updated_at: string | null; // ISO 8601 date string or null
}

/**
 * Representa una versión específica de un prompt asociado a una empresa.
 */
export interface CompanyPrompt {
  id: number;
  company_id: number;
  version: number;
  prompt_path: string;
  is_default: boolean;
  created_at: string | null; // ISO 8601 date string or null
}