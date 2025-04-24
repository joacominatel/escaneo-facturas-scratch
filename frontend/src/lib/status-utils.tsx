import { CheckCircle, Clock, XCircle, Copy, AlertTriangle, BarChart3 } from 'lucide-react'
import { type InvoiceStatus } from "@/types/invoice"

// Get the status icon component based on status
export function getStatusIcon(status: InvoiceStatus) {
  switch (status) {
    case "processed":
      return <CheckCircle className="h-4 w-4 text-green-500" />
    case "waiting_validation":
    case "processing":
      return <Clock className="h-4 w-4 text-amber-500" />
    case "failed":
      return <AlertTriangle className="h-4 w-4 text-red-500" />
    case "rejected":
      return <XCircle className="h-4 w-4 text-red-500" />
    case "duplicated":
      return <Copy className="h-4 w-4 text-blue-500" />
    default:
      return <Clock className="h-4 w-4 text-amber-500" />
  }
}

// Get the status badge class names based on status
export function getStatusBadgeClassNames(status: InvoiceStatus) {
  switch (status) {
    case "processed":
      return "bg-green-50 text-green-700 border-green-200"
    case "waiting_validation":
      return "bg-amber-50 text-amber-700 border-amber-200"
    case "processing":
      return "bg-blue-50 text-blue-700 border-blue-200"
    case "failed":
    case "rejected":
      return "bg-red-50 text-red-700 border-red-200"
    case "duplicated":
      return "bg-blue-50 text-blue-700 border-blue-200"
    default:
      return "bg-gray-50 text-gray-700 border-gray-200"
  }
}

// Get the status label based on status
export function getStatusLabel(status: InvoiceStatus): string {
  const statusLabels: Record<InvoiceStatus, string> = {
    processed: "Procesada",
    waiting_validation: "Pendiente",
    processing: "En proceso",
    failed: "Fallida",
    rejected: "Rechazada",
    duplicated: "Duplicada"
  }
  return statusLabels[status] || status
}

// Get the status color for charts and UI elements
export const statusColors = {
  processed: {
    bg: "bg-green-100",
    text: "text-green-800",
    border: "border-green-200",
    icon: <CheckCircle className="h-5 w-5 text-green-500" />,
    description: "Facturas procesadas correctamente",
    color: "#a7f3d0", // Verde pastel
  },
  waiting_validation: {
    bg: "bg-amber-100",
    text: "text-amber-800",
    border: "border-amber-200",
    icon: <Clock className="h-5 w-5 text-amber-500" />,
    description: "Facturas pendientes de validación",
    color: "#fde68a", // Ámbar pastel
  },
  processing: {
    bg: "bg-blue-100",
    text: "text-blue-800",
    border: "border-blue-200",
    icon: <BarChart3 className="h-5 w-5 text-blue-500" />,
    description: "Facturas en procesamiento",
    color: "#bae6fd", // Azul pastel
  },
  failed: {
    bg: "bg-red-100",
    text: "text-red-800",
    border: "border-red-200",
    icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
    description: "Facturas con errores de procesamiento",
    color: "#fecaca", // Rojo pastel
  },
  rejected: {
    bg: "bg-pink-100",
    text: "text-pink-800",
    border: "border-pink-200",
    icon: <XCircle className="h-5 w-5 text-pink-500" />,
    description: "Facturas rechazadas manualmente",
    color: "#fbcfe8", // Rosa pastel
  },
  duplicated: {
    bg: "bg-blue-100",
    text: "text-blue-800",
    border: "border-blue-200",
    icon: <Copy className="h-5 w-5 text-blue-500" />,
    description: "Facturas duplicadas ya procesadas",
    color: "#93c5fd", // Azul pastel
  }
}
