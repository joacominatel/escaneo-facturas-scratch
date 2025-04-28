import { InvoiceStatus } from "@/lib/api/types";

// Colores pastel para los badges de estado (clases de Tailwind)
export const statusColorMap: Record<InvoiceStatus, string> = {
  processing: "bg-blue-100 text-blue-800 hover:bg-blue-200",
  waiting_validation: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
  processed: "bg-green-100 text-green-800 hover:bg-green-200",
  failed: "bg-red-100 text-red-800 hover:bg-red-200",
  rejected: "bg-orange-100 text-orange-800 hover:bg-orange-200",
  duplicated: "bg-gray-100 text-gray-800 hover:bg-gray-200",
};

// Lista de estados posibles
export const INVOICE_STATUSES: InvoiceStatus[] = [
  "processing",
  "waiting_validation",
  "processed",
  "failed",
  "rejected",
  "duplicated",
];

// Claves para localStorage
export const LOCALSTORAGE_KEY_STATUSES = 'invoiceHistoryStatuses';
export const LOCALSTORAGE_KEY_PAGE_SIZE = 'invoiceHistoryPageSize'; 