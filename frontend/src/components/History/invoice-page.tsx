"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { useInvoicesList, useInvoiceActions } from "@/hooks/api"
import { InvoiceDetailsModal } from "@/components/invoice-details-modal"
import { getStatusIcon, getStatusBadgeClassNames, getStatusLabel } from "@/lib/status-utils"
import { downloadInvoice } from "@/lib/invoice-utils"
import { ArrowDown, ArrowUp, Download, Eye, Loader2, Search } from "lucide-react"
import { toast } from "sonner"
import type { InvoiceStatus } from "@/types/invoice"

export function UploadHistory() {
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [sortField, setSortField] = useState<string>("created_at")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [viewingInvoiceId, setViewingInvoiceId] = useState<number | null>(null)

  const { invoices, isLoading, error, pagination: { total: totalCount, pages: totalPages }, updateParams } = useInvoicesList({
    page,
    per_page: perPage,
    search: searchQuery || undefined,
    status: statusFilter || undefined,
    sort_by: sortField,
    sort_order: sortOrder,
  })

  const { retryInvoice } = useInvoiceActions()

  // Update the URL when parameters change
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    searchParams.set("tab", "history")
    if (page !== 1) searchParams.set("page", page.toString())
    if (perPage !== 10) searchParams.set("per_page", perPage.toString())
    if (searchQuery) searchParams.set("search", searchQuery)
    if (statusFilter) searchParams.set("status", statusFilter)
    if (sortField !== "created_at") searchParams.set("sort_by", sortField)
    if (sortOrder !== "desc") searchParams.set("sort_order", sortOrder)
    
    const newUrl = `${window.location.pathname}?${searchParams.toString()}`
    window.history.replaceState(null, "", newUrl)
  }, [page, perPage, searchQuery, statusFilter, sortField, sortOrder])

  // Read URL parameters on mount
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const pageParam = searchParams.get("page")
    const perPageParam = searchParams.get("per_page")
    const searchParam = searchParams.get("search")
    const statusParam = searchParams.get("status")
    const sortByParam = searchParams.get("sort_by")
    const sortOrderParam = searchParams.get("sort_order")

    if (pageParam) setPage(Number(pageParam))
    if (perPageParam) setPerPage(Number(perPageParam))
    if (searchParam) setSearchQuery(searchParam)
    if (statusParam) setStatusFilter(statusParam)
    if (sortByParam) setSortField(sortByParam)
    if (sortOrderParam && ["asc", "desc"].includes(sortOrderParam)) 
      setSortOrder(sortOrderParam as "asc" | "desc")
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1) // Reset to first page on new search
    updateParams({
      page: 1,
      search: searchQuery,
      status: statusFilter || undefined,
      sort_by: sortField,
      sort_order: sortOrder,
    })
  }

  const handleStatusChange = (value: string) => {
    setStatusFilter(value === "all" ? null : value)
    setPage(1)
    updateParams({
      page: 1,
      search: searchQuery,
      status: value === "all" ? undefined : value,
      sort_by: sortField,
      sort_order: sortOrder,
    })
  }

  const handleSort = (field: string) => {
    const newSortOrder = field === sortField && sortOrder === "desc" ? "asc" : "desc"
    setSortField(field)
    setSortOrder(newSortOrder)
    updateParams({
      sort_by: field,
      sort_order: newSortOrder,
    })
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    updateParams({ page: newPage })
  }

  const handlePerPageChange = (value: string) => {
    const newPerPage = Number(value)
    setPerPage(newPerPage)
    setPage(1) // Reset to first page when changing items per page
    updateParams({
      page: 1,
      per_page: newPerPage,
    })
  }

  const handleViewDetails = (invoiceId: number) => {
    setViewingInvoiceId(invoiceId)
    setDetailsModalOpen(true)
  }

  const handleRetry = async (invoiceId: number) => {
    try {
      await retryInvoice(invoiceId)
      toast.success("Procesamiento de factura reiniciado")
      updateParams({}) // Refetch the current page
    } catch (error) {
      toast.error("Error al reintentar el procesamiento")
    }
  }

  const SortIcon = ({ field }: { field: string }) => {
    if (field !== sortField) return null
    return sortOrder === "asc" ? 
      <ArrowUp className="h-3 w-3 ml-1" /> : 
      <ArrowDown className="h-3 w-3 ml-1" />
  }

  const renderPagination = () => {
    const items = []
    const maxVisible = 5
    const halfVisible = Math.floor(maxVisible / 2)
    
    let startPage = Math.max(1, page - halfVisible)
    let endPage = Math.min(totalPages, startPage + maxVisible - 1)
    
    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1)
    }
    
    // Add first page
    if (startPage > 1) {
      items.push(
        <PaginationItem key="first">
          <PaginationLink onClick={() => handlePageChange(1)}>1</PaginationLink>
        </PaginationItem>
      )
      
      // Add ellipsis if needed
      if (startPage > 2) {
        items.push(
          <PaginationItem key="ellipsis-start">
            <PaginationEllipsis />
          </PaginationItem>
        )
      }
    }
    
    // Add page numbers
    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink
            onClick={() => handlePageChange(i)}
            isActive={i === page}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      )
    }
    
    // Add ellipsis and last page if needed
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        items.push(
          <PaginationItem key="ellipsis-end">
            <PaginationEllipsis />
          </PaginationItem>
        )
      }
      
      items.push(
        <PaginationItem key="last">
          <PaginationLink onClick={() => handlePageChange(totalPages)}>
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      )
    }
    
    return items
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial de Facturas</CardTitle>
        <CardDescription>Ver y gestionar todas las facturas subidas al sistema</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtros y búsqueda */}
        <div className="flex flex-col gap-4 sm:flex-row">
          <form onSubmit={handleSearch} className="flex flex-1 gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre de archivo..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button type="submit">Buscar</Button>
          </form>
          <Select value={statusFilter || "all"} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="processed">Procesadas</SelectItem>
              <SelectItem value="waiting_validation">Pendientes</SelectItem>
              <SelectItem value="processing">En proceso</SelectItem>
              <SelectItem value="failed">Fallidas</SelectItem>
              <SelectItem value="rejected">Rechazadas</SelectItem>
              <SelectItem value="duplicated">Duplicadas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabla de facturas */}
        <div className="border rounded-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                    <div
                      className="flex items-center cursor-pointer"
                      onClick={() => handleSort("id")}
                    >
                      ID <SortIcon field="id" />
                    </div>
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                    <div
                      className="flex items-center cursor-pointer"
                      onClick={() => handleSort("filename")}
                    >
                      Nombre de archivo <SortIcon field="filename" />
                    </div>
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Estado</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                    <div
                      className="flex items-center cursor-pointer"
                      onClick={() => handleSort("created_at")}
                    >
                      Fecha <SortIcon field="created_at" />
                    </div>
                  </th>
                  <th className="px-4 py-2 text-right font-medium text-muted-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center">
                      <div className="flex justify-center items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Cargando facturas...</span>
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-red-600">
                      Error al cargar las facturas: {error}
                    </td>
                  </tr>
                ) : invoices.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      No se encontraron facturas con los criterios especificados
                    </td>
                  </tr>
                ) : (
                  invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-muted/50">
                      <td className="px-4 py-2">{invoice.id}</td>
                      <td className="px-4 py-2 max-w-[200px] truncate">{invoice.filename}</td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(invoice.status as InvoiceStatus)}
                          <Badge variant="outline" className={getStatusBadgeClassNames(invoice.status as InvoiceStatus)}>
                            {getStatusLabel(invoice.status as InvoiceStatus)}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        {new Date(invoice.created_at).toLocaleDateString("es-ES", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="Ver detalles"
                            onClick={() => handleViewDetails(invoice.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="Descargar"
                            onClick={() => {
                              downloadInvoice(invoice.id, invoice.filename)
                              toast.success("Descarga iniciada", {
                                description: `Descargando ${invoice.filename}`,
                              })
                            }}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          {(invoice.status === "failed" || invoice.status === "rejected") && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="Reintentar"
                              onClick={() => handleRetry(invoice.id)}
                            >
                              {getStatusIcon("processing")}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Paginación y selección de registros por página */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Mostrar</span>
            <Select value={perPage.toString()} onValueChange={handlePerPageChange}>
              <SelectTrigger className="w-[70px]">
                <SelectValue placeholder={perPage.toString()} />
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
            Mostrando {invoices.length ? (page - 1) * perPage + 1 : 0} a{" "}
            {Math.min(page * perPage, totalCount)} de {totalCount} facturas
          </div>

          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => page > 1 && handlePageChange(page - 1)}
                  className={page <= 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              
              {renderPagination()}
              
              <PaginationItem>
                <PaginationNext
                  onClick={() => page < totalPages && handlePageChange(page + 1)}
                  className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </CardContent>

      {/* Modal de detalles de factura */}
      <InvoiceDetailsModal
        invoiceId={viewingInvoiceId}
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        onViewOriginal={(id) => {
          setViewingInvoiceId(id)
          setDetailsModalOpen(true)
        }}
      />
    </Card>
  )
}
