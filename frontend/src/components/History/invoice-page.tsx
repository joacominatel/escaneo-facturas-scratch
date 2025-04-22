import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { InvoiceFilters } from "./invoice-filters"
import { InvoiceTable } from "./invoice-table"
import { InvoicePagination } from "./invoice-pagination"
import { useInvoicesList } from "@/hooks/api"
import { ErrorAlert } from "@/components/ui/error-alert"
import { Skeleton } from "@/components/ui/skeleton"

export function UploadHistory() {
  // Estado para los filtros
  const [itemsPerPage, setItemsPerPage] = useState<number>(10)

  // Hook para obtener las facturas
  const { invoices, pagination, isLoading, error, updateParams, refreshInvoices } = useInvoicesList({
    per_page: itemsPerPage,
  })

  // Función para manejar el cambio de página
  const handlePageChange = (page: number) => {
    updateParams({ page })
  }

  // Función para manejar el cambio de filtros
  const handleFiltersChange = (filters: Record<string, any>) => {
    updateParams({ ...filters, per_page: itemsPerPage })
  }

  // Función para manejar el cambio de elementos por página
  const handleItemsPerPageChange = (perPage: number) => {
    setItemsPerPage(perPage)
    updateParams({ per_page: perPage, page: 1 })
  }

  // Renderizar el estado de carga
  if (isLoading && !invoices.length) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-10 w-full max-w-sm" />
          <Skeleton className="h-10 w-[180px]" />
        </div>
        <Skeleton className="h-[400px] w-full" />
        <Skeleton className="h-10 w-[200px] ml-auto" />
      </div>
    )
  }

  // Renderizar el estado de error
  if (error) {
    return <ErrorAlert title="Error al cargar el historial de facturas" message={error} onRetry={refreshInvoices} />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial de Facturas</CardTitle>
        <CardDescription>Historial completo de facturas procesadas</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <InvoiceFilters onFiltersChange={handleFiltersChange} onRefresh={refreshInvoices} />

        <InvoiceTable 
          invoices={invoices} 
          onRefresh={refreshInvoices}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={handleItemsPerPageChange}
        />
      </CardContent>
      {pagination.pages > 1 && (
        <CardFooter>
          <InvoicePagination 
            currentPage={pagination.page} 
            totalPages={pagination.pages} 
            onPageChange={handlePageChange} 
          />
        </CardFooter>
      )}
    </Card>
  )
}
