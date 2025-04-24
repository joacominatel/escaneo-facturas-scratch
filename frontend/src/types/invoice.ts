// Define the possible invoice status types
export type InvoiceStatus = 
  | "processed" 
  | "waiting_validation" 
  | "processing" 
  | "failed" 
  | "rejected"
  | "duplicated" // New status for duplicated invoices
