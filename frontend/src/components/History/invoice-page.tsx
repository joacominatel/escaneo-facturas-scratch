"use client"

import { useState, useCallback, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { InvoiceDetailsModal } from "@/components/invoice-details-modal"
import { EnhancedFilters } from "@/components/History/enhanced-filters"
import { EnhancedPagination } from "@/components/History/enhanced-pagination"
import { InvoiceTableHeader } from "@/components/History/invoice-table-header"
import { InvoiceRow } from "@/components/History/invoice-row"
import { InvoiceStatus } from "@/components/History/invoice-status"
import { BulkActionsBar } from "@/components/History/bulk-actions-bar"
import { useInvoiceHistory } from "@/hooks/useInvoiceHistory"
import { useBulkInvoiceActions } from "@/hooks/useBulkInvoiceActions"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

export function UploadHistory() {
  // Estado para controlar modo de selección
  const [selectionMode, setSelectionMode] = useState(false)

  const {
    // Data and state
    invoices,
    isLoading,
    error,
    totalCount,
    totalPages,
    params,
    detailsModalOpen,
    setDetailsModalOpen,
    viewingInvoiceId,

    // Handlers
    handleFiltersChange,
    handlePageChange,
    handlePerPageChange,
    handleSort,
    handleRefresh,
    handleViewDetails,
    handleRetry
  } = useInvoiceHistory()

  // Hook para manejar selección múltiple y acciones en lote
  const {
    selectedInvoices,
    isActionLoading,
    hasSelection,
    selectionCount,
    toggleInvoice,
    toggleSelectAll,
    areAllSelected,
    clearSelection,
    confirmSelectedInvoices,
    retrySelectedInvoices
  } = useBulkInvoiceActions()

  // Limpiar selección al cambiar de página o filtros
  useEffect(() => {
    clearSelection()
  }, [params.page, params.status, params.search, params.date, clearSelection])

  // Determinar si hay facturas en diferentes estados para habilitar acciones específicas
  const hasWaitingValidation = useCallback(() => {
    if (!invoices.length) return false
    return selectedInvoices.some(id => {
      const invoice = invoices.find(inv => inv.id === id)
      return invoice?.status === "waiting_validation"
    })
  }, [invoices, selectedInvoices])

  const hasFailedOrRejected = useCallback(() => {
    if (!invoices.length) return false
    return selectedInvoices.some(id => {
      const invoice = invoices.find(inv => inv.id === id)
      return invoice?.status === "failed" || invoice?.status === "rejected"
    })
  }, [invoices, selectedInvoices])

  // Manejar seleccionar/deseleccionar todas las facturas visibles
  const handleToggleSelectAll = useCallback(() => {
    if (!invoices.length) return
    toggleSelectAll(invoices.map(inv => inv.id))
  }, [invoices, toggleSelectAll])

  // Handler para manejar el refresh después de acciones en lote
  const handleBulkActionComplete = useCallback(async () => {
    // Esperar un poco antes de refrescar para que la API tenga tiempo de actualizar
    setTimeout(() => {
      handleRefresh()
    }, 500)
  }, [handleRefresh])

  return (
    <Card>
      <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <CardTitle>Historial de Facturas</CardTitle>
          <CardDescription>Ver y gestionar todas las facturas subidas al sistema</CardDescription>
        </div>
        
        <div className="flex items-center gap-2">
          <Switch 
            id="selection-mode"
            checked={selectionMode}
            onCheckedChange={setSelectionMode}
          />
          <Label htmlFor="selection-mode">Modo selección</Label>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Enhanced Filters */}
        <EnhancedFilters 
          onFiltersChange={handleFiltersChange} 
          onRefresh={handleRefresh}
          initialSearch={params.search}
        />

        {/* Table with invoices */}
        <div className="border rounded-md overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <InvoiceTableHeader 
                currentSort={params.sort_by}
                currentOrder={params.sort_order}
                onSort={handleSort}
                selectionMode={selectionMode}
                allSelected={invoices.length > 0 && areAllSelected(invoices.map(inv => inv.id))}
                onToggleSelectAll={handleToggleSelectAll}
              />
              
              <TableBody>
                <InvoiceStatus 
                  isLoading={isLoading}
                  error={error}
                  isEmpty={!isLoading && !error && invoices.length === 0}
                />
                
                {!isLoading && !error && invoices.length > 0 && (
                  invoices.map((invoice) => (
                    <InvoiceRow
                      key={invoice.id}
                      invoice={invoice}
                      onViewDetails={handleViewDetails}
                      onRetry={handleRetry}
                      onRefresh={handleRefresh}
                      selectionMode={selectionMode}
                      isSelected={selectedInvoices.includes(invoice.id)}
                      onToggleSelect={toggleInvoice}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Pagination and records per page */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Mostrar</span>
            <Select value={params.per_page.toString()} onValueChange={(value) => handlePerPageChange(Number(value))}>
              <SelectTrigger className="w-[70px]">
                <SelectValue placeholder={params.per_page.toString()} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">por página</span>
          </div>

          <div className="text-sm text-muted-foreground">
            Mostrando {invoices.length ? (params.page - 1) * params.per_page + 1 : 0} a{" "}
            {Math.min(params.page * params.per_page, totalCount)} de {totalCount} facturas
          </div>

          <EnhancedPagination
            currentPage={params.page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      </CardContent>

      {/* Invoice details modal */}
      <InvoiceDetailsModal
        invoiceId={viewingInvoiceId}
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        onViewOriginal={(id) => {
          handleViewDetails(id);
        }}
      />

      {/* Barra de acciones en lote */}
      {hasSelection && selectionMode && (
        <BulkActionsBar
          selectedCount={selectionCount}
          onConfirm={async () => {
            await confirmSelectedInvoices()
            await handleBulkActionComplete()
          }}
          onRetry={async () => {
            await retrySelectedInvoices()
            await handleBulkActionComplete()
          }}
          onClear={clearSelection}
          isLoading={isActionLoading}
          hasWaitingValidation={hasWaitingValidation()}
          hasFailedOrRejected={hasFailedOrRejected()}
        />
      )}
    </Card>
  )
}
