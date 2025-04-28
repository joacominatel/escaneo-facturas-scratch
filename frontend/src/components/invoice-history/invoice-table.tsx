'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  SortingState,
  PaginationState,
  HeaderContext,
  CellContext,
  Column,
  HeaderGroup,
  Row,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"

import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  X,
} from "lucide-react"

import { InvoiceListItem, InvoiceStatus, FetchInvoiceHistoryOptions } from "@/lib/api/types"
import { fetchInvoiceHistory } from "@/lib/api/invoices"
import { InvoiceActions } from './invoice-actions'
import { useDebounce } from "@/hooks/use-debounce" // Asegúrate que este hook existe
import { LiveUpdateButton } from './live-update-button'
import { connectToInvoiceUpdates, disconnectFromInvoiceUpdates, isInvoiceSocketConnected } from '@/lib/ws/invoice-updates'
import { toast } from 'sonner'
// import type { DisconnectReason } from 'socket.io-client' // Comentado ya que no se exporta directamente

const INVOICE_STATUSES: InvoiceStatus[] = [
  "processing",
  "waiting_validation",
  "processed",
  "failed",
  "rejected",
  "duplicated",
]

interface InvoiceTableProps {
  initialData?: InvoiceListItem[]
  initialTotalCount?: number
  initialPageCount?: number
}

// Helper type para las props de header y cell con tipos correctos
type InvoiceHeaderContext = HeaderContext<InvoiceListItem, unknown>;
type InvoiceCellContext = CellContext<InvoiceListItem, unknown>;

export function InvoiceTable({ /* initialData, initialTotalCount, initialPageCount */ }: InvoiceTableProps) {
  // State
  const [data, setData] = useState<InvoiceListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)

  // Table State
  const [sorting, setSorting] = useState<SortingState>([{ id: 'created_at', desc: true }])
  const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 })
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatuses, setSelectedStatuses] = useState<Set<InvoiceStatus>>(new Set())

  // WebSocket State
  const [isLive, setIsLive] = useState(false)
  const [isConnectingWs, setIsConnectingWs] = useState(false)

  // Debounce search term
  const debouncedSearchTerm = useDebounce(searchTerm, 500)

  // Fetching logic
  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const options: FetchInvoiceHistoryOptions = {
        page: pageIndex + 1, // API usa 1-based index
        perPage: pageSize,
        search: debouncedSearchTerm || undefined,
        status: selectedStatuses.size > 0 ? Array.from(selectedStatuses) : undefined,
        sortBy: sorting[0]?.id,
        sortOrder: sorting[0]?.desc ? 'desc' : 'asc',
      }
      const result = await fetchInvoiceHistory(options)
      setData(result.invoices)
      setTotalCount(result.total)
      // Asumiendo que la API devuelve 'pages' como total de páginas
      // Si no, necesitaríamos calcularlo: Math.ceil(result.total / pageSize)
      // setPageCount(result.pages) // Si la API no lo da, react-table lo calcula
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      console.error("Error fetching invoice history:", err)
      setError(err.message || "Failed to fetch invoices")
      setData([])
      setTotalCount(0)
      toast.error("Error al cargar facturas", { description: err.message })
    } finally {
      setIsLoading(false)
    }
  }, [pageIndex, pageSize, debouncedSearchTerm, selectedStatuses, sorting])

  // Initial fetch and refetch on dependency change
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // --- WebSocket Handlers ---
  const handleWsConnect = () => {
    console.log('WS Connected!')
    setIsConnectingWs(false)
    setIsLive(true)
    toast.success('Conexión Live establecida')
  }

  // Usar 'string' ya que DisconnectReason no parece estar disponible fácilmente
  const handleWsDisconnect = (reason: string) => {
    console.log('WS Disconnected:', reason)
    setIsConnectingWs(false)
    setIsLive(false)
    if (reason !== 'io client disconnect') { // Comparar con el string específico
      toast.warning('Conexión Live perdida', { description: `Razón: ${reason}` })
    }
  }

  const handleWsConnectError = (error: Error) => {
    console.error('WS Connection Error:', error)
    setIsConnectingWs(false)
    setIsLive(false)
    toast.error('Error de conexión Live', { description: error.message })
  }

  const handleWsStatusUpdate = (update: { id: number; status: string; filename: string }) => {
    console.log('WS Invoice Status Update:', update)
    toast.info(`Factura ${update.filename} actualizada a ${update.status}`)
    // Opcional: Actualizar solo la fila afectada en lugar de refetch completo
    setData(currentData =>
      currentData.map(invoice =>
        invoice.id === update.id ? { ...invoice, status: update.status as InvoiceStatus } : invoice
      )
    )
    // O simplemente refetch para asegurar consistencia total:
    // fetchData()
  }

  const toggleLiveUpdates = () => {
    if (isLive) {
      disconnectFromInvoiceUpdates()
      setIsLive(false)
      toast.info('Conexión Live desactivada')
    } else {
      setIsConnectingWs(true)
      connectToInvoiceUpdates({
        onConnect: handleWsConnect,
        onDisconnect: handleWsDisconnect,
        onConnectError: handleWsConnectError,
        onStatusUpdate: handleWsStatusUpdate,
      })
    }
  }

  // Cleanup WebSocket on component unmount
  useEffect(() => {
    return () => {
      if (isInvoiceSocketConnected()) {
        disconnectFromInvoiceUpdates()
      }
    }
  }, [])

  // Table Columns Definition
  const columns = useMemo<ColumnDef<InvoiceListItem>[]>(() => [
    {
      accessorKey: "filename",
      header: ({ column }: { column: Column<InvoiceListItem, unknown> }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Nombre Archivo
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }: InvoiceCellContext) => <div className="font-medium">{row.getValue("filename")}</div>,
      size: 300, // Ejemplo de tamaño
    },
    {
      accessorKey: "status",
      header: "Estado",
      cell: ({ row }: InvoiceCellContext) => {
        const status = row.getValue("status") as InvoiceStatus
        // TODO: Add nice badges for status
        return <span className="capitalize">{status.replace('_', ' ')}</span>
      },
      size: 150,
    },
    {
      accessorKey: "created_at",
      header: ({ column }: { column: Column<InvoiceListItem, unknown> }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Fecha Creación
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }: InvoiceCellContext) => {
        try {
          const date = new Date(row.getValue("created_at"))
          return <div suppressHydrationWarning>{date.toLocaleString()}</div> // suppressHydrationWarning por si SSR/CSR difieren
        } catch (e) {
            return <div>Fecha inválida</div>
        }
      },
      size: 200,
    },
    {
      id: "actions",
      header: () => <div className="text-right">Acciones</div>,
      cell: ({ row }: InvoiceCellContext) => (
        <div className="text-right">
            <InvoiceActions invoice={row.original} onActionComplete={fetchData} />
        </div>
      ),
      size: 50,
    },
  ], [fetchData]) // fetchData en deps para que onActionComplete esté actualizado

  // Pagination logic derived state
  const pageCount = useMemo(() => Math.ceil(totalCount / pageSize), [totalCount, pageSize])

  // React Table Instance
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      pagination: { pageIndex, pageSize },
    },
    manualPagination: true, // La paginación se maneja manualmente (API)
    manualSorting: true,    // La ordenación se maneja manualmente (API)
    manualFiltering: true, // El filtrado se maneja manualmente (API)
    pageCount: pageCount, // Informar a la tabla del total de páginas
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(), // Necesario si usamos ordenación interna
    getPaginationRowModel: getPaginationRowModel(), // Necesario para controles de paginación
    debugTable: process.env.NODE_ENV === 'development', // Logs útiles en dev
  })

  // Status Filter Component
  const StatusFilter = () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="ml-2 h-8 border-dashed">
          <Filter className="mr-2 h-4 w-4" />
          Estado
          {selectedStatuses.size > 0 && (
            <span className="ml-2 rounded-md bg-primary px-2 py-0.5 text-xs text-primary-foreground">
              {selectedStatuses.size}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command>
          {/* <CommandInput placeholder="Buscar estado..." /> */}
          <CommandList>
            <CommandEmpty>No encontrado.</CommandEmpty>
            <CommandGroup>
              {INVOICE_STATUSES.map((status) => (
                <CommandItem
                  key={status}
                  onSelect={() => {
                    const newSelection = new Set(selectedStatuses)
                    if (newSelection.has(status)) {
                      newSelection.delete(status)
                    } else {
                      newSelection.add(status)
                    }
                    setSelectedStatuses(newSelection)
                    setPagination((p: PaginationState) => ({ ...p, pageIndex: 0 }))
                  }}
                >
                  <Checkbox
                    className="mr-2"
                    checked={selectedStatuses.has(status)}
                    onCheckedChange={(checked) => {
                      const newSelection = new Set(selectedStatuses)
                      if (checked === true) {
                        newSelection.add(status)
                      } else {
                        newSelection.delete(status)
                      }
                      setSelectedStatuses(newSelection)
                      setPagination((p: PaginationState) => ({ ...p, pageIndex: 0 }))
                    }}
                    aria-labelledby={`filter-label-${status}`}
                  />
                  <span id={`filter-label-${status}`} className="capitalize">
                    {status.replace('_', ' ')}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
            {selectedStatuses.size > 0 && (
              <>
                <CommandList /> {/* Separator doesn't seem to exist, use list */} 
                <CommandGroup>
                  <CommandItem
                    onSelect={() => {
                       setSelectedStatuses(new Set())
                       setPagination((p: PaginationState) => ({ ...p, pageIndex: 0 }))
                     }}
                    className="justify-center text-center text-muted-foreground hover:text-destructive"
                  >
                    Limpiar filtros
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )

  return (
    <div className="space-y-4">
      {/* Filters and Actions Toolbar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Buscar por nombre de archivo..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="h-8 w-[150px] lg:w-[250px]"
          />
          <StatusFilter />
          { (debouncedSearchTerm || selectedStatuses.size > 0) && (
            <Button
              variant="ghost"
              onClick={() => {
                setSearchTerm("")
                setSelectedStatuses(new Set())
                setPagination((p: PaginationState) => ({ ...p, pageIndex: 0 }))
              }}
              className="h-8 px-2 lg:px-3 text-muted-foreground hover:text-destructive"
            >
              Reset
              <X className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
        <LiveUpdateButton
          isConnected={isLive}
          isConnecting={isConnectingWs}
          onToggle={toggleLiveUpdates}
        />
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup: HeaderGroup<InvoiceListItem>) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} style={{ width: header.column.getSize() !== 150 ? header.column.getSize() : undefined }}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Cargando datos...
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-destructive">
                  Error: {error}
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row: Row<InvoiceListItem>) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No se encontraron resultados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {/* Podríamos añadir selección de filas si fuera necesario */} 
          {/* {table.getFilteredSelectedRowModel().rows.length} of{" "} */} 
          {totalCount} fila(s) en total.
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Filas por página</p>
            <Select
              value={`${pageSize}`}
              onValueChange={(value) => {
                setPagination({ pageIndex: 0, pageSize: Number(value) })
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 40, 50].map((size) => (
                  <SelectItem key={size} value={`${size}`}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            Página {pageIndex + 1} de {pageCount}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Ir a primera página</span>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Ir a página anterior</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Ir a página siguiente</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(pageCount - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Ir a última página</span>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 