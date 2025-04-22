import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { InvoiceFilters } from "./invoice-filters"
import { InvoiceTable } from "./invoice-table"
import { InvoicePagination } from "./invoice-pagination"
import { useInvoicesList } from "@/hooks/api"
import { ErrorAlert } from "@/components/ui/error-alert"
import { Skeleton } from "@/components/ui/skeleton"
import { useDebounce } from "@/hooks/useDebounce"
import { useThrottle } from "@/hooks/useThrottle"

export function UploadHistory() {
  // Estado para los filtros
  const [itemsPerPage, setItemsPerPage] = useState<number>(10)
  const [filters, setFilters] = useState<Record<string, any>>({})
  
  // Aplicar debounce a los filtros para evitar múltiples solicitudes mientras el usuario cambia los filtros
  const debouncedFilters = useDebounce(filters, 500)
  
  // Aplicar throttling a los cambios de elementos por página
  const throttledItemsPerPage = useThrottle(itemsPerPage, 1000)

  // Hook para obtener las facturas
  const { invoices, pagination, isLoading, error, updateParams, refreshInvoices } = useInvoicesList({
    per_page: throttledItemsPerPage,
  })

  // Efecto para aplicar los filtros debounced
  useEffect(() => {
    updateParams({ ...debouncedFilters, per_page: throttledItemsPerPage })
  }, [debouncedFilters, throttledItemsPerPage, updateParams])

  // Función para manejar el cambio de página
  const handlePageChange = useCallback((page: number) => {
    updateParams({ page })
  }, [updateParams])

  // Función para manejar el cambio de filtros
  const handleFiltersChange = useCallback((newFilters: Record<string, any>) => {
    setFilters(prev => {
      // Solo actualizar si los filtros han cambiado
      if (JSON.stringify(prev) !== JSON.stringify(newFilters)) {
        return newFilters
      }
      return prev
    })
  }, [])

  // Función para manejar el cambio de elementos por página
  const handleItemsPerPageChange = useCallback((perPage: number) => {
    setItemsPerPage(perPage)
  }, [])

  // Función para refrescar los datos con limpieza de caché
  const handleRefresh = useCallback(() => {
    refreshInvoices(true) // true para limpiar la caché antes de refrescar
  }, [refreshInvoices])

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
    return <ErrorAlert title="Error al cargar el historial de facturas" message={error} onRetry={handleRefresh} />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial de Facturas</CardTitle>
        <CardDescription>Historial completo de facturas procesadas</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <InvoiceFilters onFiltersChange={handleFiltersChange} onRefresh={handleRefresh} />

        <InvoiceTable 
          invoices={invoices} 
          onRefresh={handleRefresh}
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
