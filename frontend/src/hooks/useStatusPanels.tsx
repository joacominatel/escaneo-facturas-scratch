import { useInvoicesSummary } from "@/hooks/api"
import { statusColors } from "@/lib/status-utils"
import { FileText } from "lucide-react"

export function useStatusPanels() {
  const { summary, isLoading, error, refreshSummary } = useInvoicesSummary()
  
  // Calculate total invoices
  const totalInvoices = summary ? Object.values(summary).reduce((acc, count) => acc + count, 0) : 0
  
  // Prepare data for the status panels
  const statusPanels = [
    {
      key: "total",
      title: "Total Facturas",
      value: totalInvoices,
      color: { bg: "bg-purple-100", text: "text-purple-800", border: "border-purple-200" },
      icon: <FileText className="h-5 w-5 text-purple-500" />,
      description: "Total de facturas en el sistema",
    },
    {
      key: "processed",
      title: "Procesadas",
      value: summary?.processed || 0,
      color: statusColors.processed,
      icon: statusColors.processed.icon,
      description: statusColors.processed.description,
    },
    {
      key: "waiting_validation",
      title: "Pendientes",
      value: summary?.waiting_validation || 0,
      color: statusColors.waiting_validation,
      icon: statusColors.waiting_validation.icon,
      description: statusColors.waiting_validation.description,
    },
    {
      key: "processing",
      title: "En Proceso",
      value: summary?.processing || 0,
      color: statusColors.processing,
      icon: statusColors.processing.icon,
      description: statusColors.processing.description,
    }
  ]

  // Add panels for failed, rejected, and duplicated status only if they exist in the summary
  if (summary?.failed) {
    statusPanels.push({
      key: "failed",
      title: "Fallidas",
      value: summary.failed,
      color: statusColors.failed,
      icon: statusColors.failed.icon,
      description: statusColors.failed.description,
    })
  }

  if (summary?.rejected) {
    statusPanels.push({
      key: "rejected",
      title: "Rechazadas",
      value: summary.rejected,
      color: statusColors.rejected,
      icon: statusColors.rejected.icon,
      description: statusColors.rejected.description,
    })
  }

  if (summary?.duplicated) {
    statusPanels.push({
      key: "duplicated",
      title: "Duplicadas",
      value: summary.duplicated,
      color: statusColors.duplicated,
      icon: statusColors.duplicated.icon,
      description: statusColors.duplicated.description,
    })
  }

  return {
    statusPanels,
    isLoading,
    error,
    refreshSummary,
    totalInvoices
  }
}