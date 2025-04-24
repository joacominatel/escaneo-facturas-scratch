import { useState, useCallback } from "react"
import { useInvoicesList, useInvoiceActions } from "@/hooks/api"
import { useUrlParams } from "@/hooks/useUrlParams"
import { toast } from "sonner"

interface InitialFilterParams {
  page?: number
  per_page?: number
  search?: string
  status?: string
  sort_by?: string
  sort_order?: "asc" | "desc"
  date?: string
}

export function useInvoiceHistory(initialFilters: InitialFilterParams = {}) {
  // Default values
  const defaultValues = {
    page: 1,
    per_page: 10,
    sort_by: "created_at",
    sort_order: "desc" as const,
    ...initialFilters
  }
  
  // URL Parameters management
  const { params, updateParams } = useUrlParams({ defaultValues })
  
  // Modal state
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [viewingInvoiceId, setViewingInvoiceId] = useState<number | null>(null)
  
  // Fetch invoices with the current params
  const { 
    invoices, 
    isLoading, 
    error, 
    pagination: { total: totalCount, pages: totalPages }, 
    updateParams: updateInvoiceParams,
    refreshInvoicesList
  } = useInvoicesList(params)
  
  // Actions for invoices
  const { retryInvoice, isLoading: isActionLoading } = useInvoiceActions()

  // Handle filter changes
  const handleFiltersChange = useCallback((filters: Record<string, any>) => {
    const newParams = { ...params, ...filters, page: 1 }
    updateParams(newParams)
    updateInvoiceParams(newParams)
  }, [params, updateParams, updateInvoiceParams])
  
  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    const newParams = { ...params, page }
    updateParams(newParams)
    updateInvoiceParams(newParams)
  }, [params, updateParams, updateInvoiceParams])
  
  // Handle per page change
  const handlePerPageChange = useCallback((perPage: number) => {
    const newParams = { ...params, per_page: perPage, page: 1 }
    updateParams(newParams)
    updateInvoiceParams(newParams)
    toast.success(`Mostrando ${perPage} facturas por página`)
  }, [params, updateParams, updateInvoiceParams])
  
  // Handle sort
  const handleSort = useCallback((field: string) => {
    const newSortOrder = field === params.sort_by && params.sort_order === "desc" ? "asc" : "desc"
    const newParams = { 
      ...params, 
      sort_by: field, 
      sort_order: newSortOrder 
    }
    updateParams(newParams)
    updateInvoiceParams(newParams)
  }, [params, updateParams, updateInvoiceParams])
  
  // Handle refresh
  const handleRefresh = useCallback(() => {
    refreshInvoicesList()
    toast.success("Lista actualizada", {
      description: "La lista de facturas ha sido actualizada"
    })
  }, [refreshInvoicesList])
  
  // Handle view details
  const handleViewDetails = useCallback((invoiceId: number) => {
    setViewingInvoiceId(invoiceId)
    setDetailsModalOpen(true)
  }, [])
  
  // Handle retry
  const handleRetry = useCallback(async (invoiceId: number) => {
    try {
      await retryInvoice(invoiceId)
      toast.success("Procesamiento de factura reiniciado")
      refreshInvoicesList()
    } catch (error) {
      toast.error("Error al reintentar el procesamiento")
    }
  }, [retryInvoice, refreshInvoicesList])

  return {
    // Data
    invoices,
    isLoading,
    error,
    totalCount,
    totalPages,
    params,
    
    // Modal state
    detailsModalOpen,
    setDetailsModalOpen,
    viewingInvoiceId,
    setViewingInvoiceId,
    
    // Actions state
    isActionLoading,
    
    // Handlers
    handleFiltersChange,
    handlePageChange,
    handlePerPageChange,
    handleSort,
    handleRefresh,
    handleViewDetails,
    handleRetry
  }
}