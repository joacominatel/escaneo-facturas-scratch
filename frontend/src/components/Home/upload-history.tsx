"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle, Clock, Download, Eye, RefreshCw, Search, XCircle } from 'lucide-react'
import { useInvoicesList } from "@/hooks/api"
import { Skeleton } from "@/components/ui/skeleton"
import { ErrorAlert } from "@/components/ui/error-alert"
import { 
  Pagination, 
  PaginationContent,
  PaginationEllipsis, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { CalendarIcon } from 'lucide-react'
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

type InvoiceStatus = "processed" | "waiting_validation" | "processing" | "failed" | "rejected"

export function UploadHistory() {
  // Estado para los filtros
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [itemsPerPage, setItemsPerPage] = useState<number>(10)

  // Hook para obtener las facturas
  const { 
    invoices, 
    pagination, 
    isLoading, 
    error, 
    updateParams, 
    refreshInvoices 
  } = useInvoicesList({
    per_page: itemsPerPage,
  })

  // Efecto para aplicar filtros cuando cambian
  useEffect(() => {
    const filters: Record<string, any> = {
      per_page: itemsPerPage,
    }

    if (statusFilter !== "all") {
      filters.status = statusFilter
    }

    if (date) {
      filters.date = format(date, "yyyy-MM-dd")
    }

    updateParams(filters)
  }, [statusFilter, date, itemsPerPage, updateParams])

  // Función para manejar la búsqueda
  const handleSearch = () => {
    if (searchTerm.trim()) {
      updateParams({ op_number: searchTerm.trim() })
    } else {
      // Si el término de búsqueda está vacío, eliminamos el filtro
      const currentParams = { ...pagination, per_page: itemsPerPage }
      if (statusFilter !== "all") {
        Object.assign(currentParams, { status: statusFilter })
      }
      if (date) {
        Object.assign(currentParams, { date: format(date, "yyyy-MM-dd") })
      }
      updateParams(currentParams)
    }
  }

  // Función para manejar el cambio de página
  const handlePageChange = (page: number) => {
    updateParams({ page })
  }

  // Función para obtener el icono de estado
  const getStatusIcon = (status: InvoiceStatus) => {
    switch (status) {
      case "processed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "waiting_validation":
      case "processing":
        return <Clock className="h-4 w-4 text-amber-500" />
      case "failed":
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-amber-500" />
    }
  }

  // Función para obtener el badge de estado
  const getStatusBadge = (status: InvoiceStatus) => {
    switch (status) {
      case "processed":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Procesada
          </Badge>
        )
      case "waiting_validation":
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            Pendiente
          </Badge>
        )
      case "processing":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            En proceso
          </Badge>
        )
      case "failed":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Fallida
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Rechazada
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            Desconocido
          </Badge>
        )
    }
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
    return (
      <ErrorAlert
        title="Error al cargar el historial de facturas"
        message={error}
        onRetry={refreshInvoices}
      />
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial de Facturas</CardTitle>
        <CardDescription>Historial completo de facturas procesadas</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-full max-w-sm items-center space-x-2">
            <Input
              placeholder="Buscar por número de factura..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch()
                }
              }}
            />
            <Button variant="outline" size="sm" className="h-9 px-3" onClick={handleSearch}>
              <Search className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-[180px]">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="processed">Procesadas</SelectItem>
                <SelectItem value="waiting_validation">Pendientes</SelectItem>
                <SelectItem value="processing">En proceso</SelectItem>
                <SelectItem value="failed">Fallidas</SelectItem>
                <SelectItem value="rejected">Rechazadas</SelectItem>
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "h-9 w-[240px] justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP", { locale: es }) : "Filtrar por fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(date) => {
                    setDate(date)
                  }}
                  initialFocus
                />
                {date && (
                  <div className="p-3 border-t border-border flex justify-end">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setDate(undefined)}
                    >
                      Limpiar
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-9">
                  {itemsPerPage} por página
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setItemsPerPage(5)}>5 por página</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setItemsPerPage(10)}>10 por página</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setItemsPerPage(20)}>20 por página</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setItemsPerPage(50)}>50 por página</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9" 
              onClick={refreshInvoices}
              title="Actualizar"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre de archivo</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No se encontraron facturas
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.filename}</TableCell>
                    <TableCell>{new Date(invoice.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(invoice.status as InvoiceStatus)}
                        {getStatusBadge(invoice.status as InvoiceStatus)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          title="Ver detalles"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          title="Descargar"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <CardFooter>
        {pagination.pages > 1 && (
          <Pagination className="w-full flex justify-end">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => handlePageChange(Math.max(1, pagination.page - 1))}
                  aria-disabled={pagination.page <= 1}
                  className={cn({ 'pointer-events-none opacity-50': pagination.page <= 1 })}
                />
              </PaginationItem>
              
              {/* Mostrar primera página */}
              {pagination.page > 2 && (
                <PaginationItem>
                  <PaginationLink onClick={() => handlePageChange(1)}>1</PaginationLink>
                </PaginationItem>
              )}
              {/* Mostrar elipsis si hay muchas páginas */}
              {pagination.page > 3 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
              
              {/* Mostrar página anterior si no es la primera */}
              {pagination.page > 1 && (
                <PaginationItem>
                  <PaginationLink onClick={() => handlePageChange(pagination.page - 1)}>
                    {pagination.page - 1}
                  </PaginationLink>
                </PaginationItem>
              )}
              
              {/* Página actual */}
              <PaginationItem>
                <PaginationLink isActive>{pagination.page}</PaginationLink>
              </PaginationItem>
              
              {/* Mostrar página siguiente si no es la última */}
              {pagination.page < pagination.pages && (
                <PaginationItem>
                  <PaginationLink onClick={() => handlePageChange(pagination.page + 1)}>
                    {pagination.page + 1}
                  </PaginationLink>
                </PaginationItem>
              )}
              {/* Mostrar elipsis si hay muchas páginas */}
              {pagination.page < pagination.pages - 2 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
              
              {/* Mostrar última página */}
              {pagination.page < pagination.pages - 1 && (
                <PaginationItem>
                  <PaginationLink onClick={() => handlePageChange(pagination.pages)}>
                    {pagination.pages}
                  </PaginationLink>
                </PaginationItem>
              )}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => handlePageChange(Math.min(pagination.pages, pagination.page + 1))}
                  aria-disabled={pagination.page >= pagination.pages}
                  className={cn({ 'pointer-events-none opacity-50': pagination.page >= pagination.pages })}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </CardFooter>
    </Card>
  )
}
