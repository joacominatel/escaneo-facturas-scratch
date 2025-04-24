"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { InvoiceDetailsModal } from "@/components/invoice-details-modal"
import { EnhancedFilters } from "@/components/History/enhanced-filters"
import { EnhancedPagination } from "@/components/History/enhanced-pagination"
import { InvoiceTableHeader } from "@/components/History/invoice-table-header"
import { InvoiceRow } from "@/components/History/invoice-row"
import { InvoiceStatus } from "@/components/History/invoice-status"
import { useInvoiceHistory } from "@/hooks/useInvoiceHistory"

export function UploadHistory() {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial de Facturas</CardTitle>
        <CardDescription>Ver y gestionar todas las facturas subidas al sistema</CardDescription>
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
    </Card>
  )
}
