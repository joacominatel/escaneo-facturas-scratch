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
  RowSelectionState,
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
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"

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
import { InvoiceActions } from '@/components/invoice-history/invoice-actions'
import { useDebounce } from "@/hooks/use-debounce"
import { LiveUpdateButton } from '@/components/invoice-history/live-update-button'
import { BulkActionBar } from '@/components/invoice-history/bulk-action-bar'
import { connectToInvoiceUpdates, disconnectFromInvoiceUpdates, isInvoiceSocketConnected } from '@/lib/ws/invoice-updates'
import { toast } from 'sonner'

// Colores pastel para los badges de estado (clases de Tailwind)
const statusColorMap: Record<InvoiceStatus, string> = {
  processing: "bg-blue-100 text-blue-800 hover:bg-blue-200",
  waiting_validation: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
  processed: "bg-green-100 text-green-800 hover:bg-green-200",
  failed: "bg-red-100 text-red-800 hover:bg-red-200",
  rejected: "bg-orange-100 text-orange-800 hover:bg-orange-200", // Usando naranja para rechazado
  duplicated: "bg-gray-100 text-gray-800 hover:bg-gray-200",
};

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
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatuses, setSelectedStatuses] = useState<Set<InvoiceStatus>>(new Set())

  // WebSocket State
  const [isLive, setIsLive] = useState(false)
  const [isConnectingWs, setIsConnectingWs] = useState(false)

  // Debounce search term
  const debouncedSearchTerm = useDebounce(searchTerm, 500)

  // Fetching logic
  const fetchData = useCallback(async (resetSelection = false) => {
    setIsLoading(true)
    setError(null)
    if(resetSelection) {
        setRowSelection({})
    }
    try {
      const options: FetchInvoiceHistoryOptions = {
        page: pageIndex + 1,
        perPage: pageSize,
        search: debouncedSearchTerm || undefined,
        status: selectedStatuses.size > 0 ? Array.from(selectedStatuses) : undefined,
        sortBy: sorting[0]?.id,
        sortOrder: sorting[0]?.desc ? 'desc' : 'asc',
      }
      const result = await fetchInvoiceHistory(options)
      setData(result.invoices)
      setTotalCount(result.total)
    } catch (err: any) {
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
    fetchData(true)
  }, [fetchData])

  // --- WebSocket Handlers ---
  const handleWsConnect = () => {
    console.log('WS Connected!')
    setIsConnectingWs(false)
    setIsLive(true)
    toast.success('Conexión Live establecida')
  }

  const handleWsDisconnect = (reason: unknown) => {
    const reasonString = String(reason);
    console.log('WS Disconnected:', reasonString);
    setIsConnectingWs(false);
    setIsLive(false);
    if (reasonString !== 'io client disconnect') {
      toast.warning('Conexión Live perdida', { description: `Razón: ${reasonString}` });
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
    setData(currentData =>
      currentData.map(invoice =>
        invoice.id === update.id ? { ...invoice, status: update.status as InvoiceStatus } : invoice
      )
    )
  }

  const toggleLiveUpdates = () => {
    if (isLive) {
      disconnectFromInvoiceUpdates()
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
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Seleccionar todas las filas de la página actual"
          className="translate-y-[2px]"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Seleccionar fila"
          className="translate-y-[2px]"
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40,
    },
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
      size: 300,
    },
    {
      accessorKey: "status",
      header: "Estado",
      cell: ({ row }: InvoiceCellContext) => {
        const status = row.getValue("status") as InvoiceStatus
        const colorClass = statusColorMap[status] || statusColorMap.duplicated;

        return (
          <Badge variant="outline" className={`border-none ${colorClass}`}>
             {status.replace('_', ' ')}
          </Badge>
        )
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
          return <div suppressHydrationWarning>{date.toLocaleString()}</div>
        } catch (e) {
            return <div>Fecha inválida</div>
        }
      },
      size: 200,
    },
    {
      id: "actions",
      header: () => <div className="text-right pr-4">Acciones</div>,
      cell: ({ row }: InvoiceCellContext) => (
        <div className="text-right">
            <InvoiceActions invoice={row.original} onActionComplete={() => fetchData(true)} />
        </div>
      ),
      size: 50,
    },
  ], [fetchData])

  // Pagination logic derived state
  const pageCount = useMemo(() => Math.ceil(totalCount / pageSize), [totalCount, pageSize])

  // React Table Instance
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      pagination: { pageIndex, pageSize },
      rowSelection,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    pageCount: pageCount,
    onSortingChange: setSorting,
    onPaginationChange: (updater) => {
        setRowSelection({});
        setPagination(updater);
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    debugTable: process.env.NODE_ENV === 'development',
  })

  // Obtener las filas seleccionadas para pasarlas a la barra de acciones
  const selectedRowsData = useMemo(() => {
    return table.getSelectedRowModel().rows.map(row => row.original);
  }, [rowSelection, table]);

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
                    setRowSelection({})
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
                      setRowSelection({})
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
                <CommandList />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => {
                       setSelectedStatuses(new Set())
                       setPagination((p: PaginationState) => ({ ...p, pageIndex: 0 }))
                       setRowSelection({})
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
    <div className="space-y-4 relative pb-20">
      {/* Filters and Actions Toolbar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Input
            placeholder="Buscar por nombre..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="h-8 w-[150px] lg:w-[200px]"
          />
          <StatusFilter />
          { (debouncedSearchTerm || selectedStatuses.size > 0) && (
            <Button
              variant="ghost"
              onClick={() => {
                setSearchTerm("")
                setSelectedStatuses(new Set())
                setPagination((p: PaginationState) => ({ ...p, pageIndex: 0 }))
                setRowSelection({})
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
                  className={row.getIsSelected() ? "bg-muted/50" : ""}
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
          {table.getFilteredSelectedRowModel().rows.length > 0 && (
            <span>
               {table.getFilteredSelectedRowModel().rows.length} de{" "}
            </span>
          )}
          {totalCount} fila(s) en total.
          {table.getFilteredSelectedRowModel().rows.length > 0 && (
             <Button
                variant="link"
                size="sm"
                className="ml-4 h-auto p-0 text-xs"
                onClick={() => setRowSelection({}) }
            >
                Limpiar selección
            </Button>
          )}
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Filas por página</p>
            <Select
              value={`${pageSize}`}
              onValueChange={(value) => {
                setRowSelection({});
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

      {/* Barra de acciones flotante */}
      <BulkActionBar
        selectedInvoices={selectedRowsData}
        onActionComplete={() => fetchData(true)}
        onClearSelection={() => setRowSelection({})}
      />
    </div>
  )
} 