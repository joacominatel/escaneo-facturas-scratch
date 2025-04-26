/**
 * Invoice status type definitions
 */
export type InvoiceStatusType = 
  | 'processed' 
  | 'waiting_validation' 
  | 'processing' 
  | 'failed' 
  | 'rejected' 
  | 'duplicated';

export interface InvoiceStatus {
  label: string;
  value: InvoiceStatusType;
  variant: "default" | "outline" | "secondary" | "destructive" | null;
}

export interface Invoice {
  id: number;
  filename: string;
  created_at: string;
  status: InvoiceStatusType;
}

export interface InvoiceItemProps {
  invoice: Invoice;
  onView: (id: number) => void;
  onDownload: (id: number) => void;
  onRetry: (id: number) => void;
  onConfirm: (id: number) => void;
  onReject: (id: number) => void;
  isRetrying: boolean;
  isConfirming: boolean;
  isRejecting: boolean;
  activeActionId: number | null;
}

export interface RecentInvoicesProps {
  className?: string;
}