import { InvoiceStatus, InvoiceStatusType } from "./types";

/**
 * Status mapping for invoice status display
 */
export const statusMap: Record<InvoiceStatusType, InvoiceStatus> = {
  processed: { label: "Processed", value: "processed", variant: "default" },
  waiting_validation: { label: "Waiting Validation", value: "waiting_validation", variant: "secondary" },
  processing: { label: "Processing", value: "processing", variant: "secondary" },
  failed: { label: "Failed", value: "failed", variant: "destructive" },
  rejected: { label: "Rejected", value: "rejected", variant: "outline" },
  duplicated: { label: "Duplicated", value: "duplicated", variant: "outline" },
};

/**
 * Get status-specific background color classes
 */
export const getStatusBackground = (status: InvoiceStatusType): string => {
  const bgMap: Record<InvoiceStatusType, string> = {
    processed:
      "bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800",
    waiting_validation:
      "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800",
    processing:
      "bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800",
    failed:
      "bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-red-200 dark:border-red-800",
    rejected:
      "bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800",
    duplicated:
      "bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 border-amber-200 dark:border-amber-800",
  };
  return bgMap[status] || "";
};

/**
 * Get available actions for an invoice based on status
 */
export const getAvailableActions = (status: InvoiceStatusType): string[] => {
  const actionMap: Record<InvoiceStatusType, string[]> = {
    processed: ["view", "download"],
    waiting_validation: ["confirm", "reject", "view", "download"],
    processing: ["download"],
    failed: ["view", "retry"],
    rejected: ["retry", "view", "download"],
    duplicated: ["redirect", "download"],
  };
  return actionMap[status] || ["view"];
};

/**
 * Generate sample data for testing
 */
export const generateSampleInvoices = (): any[] => {
  return [
    {
      id: 1,
      filename: "INV-2023-001.pdf",
      created_at: "2023-04-15T10:30:00",
      status: "processed",
    },
    {
      id: 2,
      filename: "INV-2023-002.pdf",
      created_at: "2023-04-14T14:45:00",
      status: "waiting_validation",
    },
    {
      id: 3,
      filename: "INV-2023-003.pdf",
      created_at: "2023-04-12T09:15:00",
      status: "failed",
    },
    {
      id: 4,
      filename: "INV-2023-004.pdf",
      created_at: "2023-04-10T16:20:00",
      status: "processing",
    },
    {
      id: 5,
      filename: "INV-2023-005.pdf",
      created_at: "2023-04-08T11:05:00",
      status: "duplicated",
    },
  ];
};