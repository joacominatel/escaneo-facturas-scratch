"use client"

import { useState, useCallback, memo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle, Clock, Download, Eye, MoreHorizontal, RefreshCw, XCircle } from "lucide-react"
import { useInvoiceActions } from "@/hooks/api"
import { toast } from "sonner"
import { InvoiceDetailsModal } from "@/components/invoice-details-modal"
// Importar la función de utilidad para descargar facturas
import { downloadInvoice } from "@/lib/invoice-utils"

type InvoiceStatus = "processed" | "waiting_validation" | "processing" | "failed" | "rejected"

interface Invoice {
  id: number
  filename: string
  status: string
  created_at: string
}

interface InvoiceTableProps {
  invoices: Invoice[]
  onRefresh: () => void
  itemsPerPage: number
  onItemsPerPageChange: (perPage: number) => void
}

// Componente memoizado para evitar renderizaciones innecesarias
const InvoiceTableRow = memo(
  ({
    invoice,
    onViewDetails,
    onConfirm,
    onReject,
    onRetry,
    isActionLoading,
  }: {
    invoice: Invoice
    onViewDetails: (id: number) => void
    onConfirm: (id: number) => void
    onReject: (id: number) => void
    onRetry: (id: number) => void
    isActionLoading: boolean
  }) => {
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

    return (
      <TableRow>
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
              className="h-8 w-8 transition-all hover:scale-110"
              title="Ver detalles"
              onClick={() => onViewDetails(invoice.id)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 transition-all hover:scale-110"
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

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onViewDetails(invoice.id)}>
                  <Eye className="h-4 w-4 mr-2" /> Ver detalles
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => downloadInvoice(invoice.id, invoice.filename)}>
                  <Download className="h-4 w-4 mr-2" /> Descargar
                </DropdownMenuItem>

                {invoice.status === "waiting_validation" && (
                  <>
                    <DropdownMenuItem onClick={() => onConfirm(invoice.id)} disabled={isActionLoading}>
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" /> Confirmar
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => onReject(invoice.id)} disabled={isActionLoading}>
                      <XCircle className="h-4 w-4 mr-2 text-red-500" /> Rechazar
                    </DropdownMenuItem>
                  </>
                )}

                {(invoice.status === "failed" || invoice.status === "rejected") && (
                  <DropdownMenuItem
                    onClick={() => onRetry(invoice.id)}
                    disabled={isActionLoading}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" /> Reintentar
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </TableCell>
      </TableRow>
    )
  },
)
InvoiceTableRow.displayName = "InvoiceTableRow"

export function InvoiceTable({ invoices, onRefresh, itemsPerPage, onItemsPerPageChange }: InvoiceTableProps) {
  const { confirmInvoice, rejectInvoice, retryInvoice, isLoading } = useInvoiceActions()
  const [selectedInvoice, setSelectedInvoice] = useState<number | null>(null)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [viewingInvoiceId, setViewingInvoiceId] = useState<number | null>(null)

  // Función para manejar la confirmación de una factura
  const handleConfirm = useCallback(async () => {
    if (!selectedInvoice) return

    try {
      await confirmInvoice(selectedInvoice)
      toast.success("Factura confirmada correctamente")
      setConfirmDialogOpen(false)
      onRefresh()
    } catch (error) {
      toast.error("Error al confirmar la factura")
    }
  }, [selectedInvoice, confirmInvoice, onRefresh])

  // Función para manejar el rechazo de una factura
  const handleReject = useCallback(async () => {
    if (!selectedInvoice || !rejectReason.trim()) return

    try {
      await rejectInvoice(selectedInvoice, rejectReason)
      toast.success("Factura rechazada correctamente")
      setRejectDialogOpen(false)
      setRejectReason("")
      onRefresh()
    } catch (error) {
      toast.error("Error al rechazar la factura")
    }
  }, [selectedInvoice, rejectReason, rejectInvoice, onRefresh])

  // Función para manejar el reintento de una factura
  const handleRetry = useCallback(
    async (invoiceId: number) => {
      try {
        await retryInvoice(invoiceId)
        toast.success("Procesamiento de factura reiniciado")
        onRefresh()
      } catch (error) {
        toast.error("Error al reintentar el procesamiento")
      }
    },
    [retryInvoice, onRefresh],
  )

  // Función para abrir el modal de detalles
  const handleViewDetails = useCallback((invoiceId: number) => {
    setViewingInvoiceId(invoiceId)
    setDetailsModalOpen(true)
  }, [])

  // Función para abrir el diálogo de confirmación
  const handleOpenConfirmDialog = useCallback((invoiceId: number) => {
    setSelectedInvoice(invoiceId)
    setConfirmDialogOpen(true)
  }, [])

  // Función para abrir el diálogo de rechazo
  const handleOpenRejectDialog = useCallback((invoiceId: number) => {
    setSelectedInvoice(invoiceId)
    setRejectDialogOpen(true)
  }, [])

  // Función para manejar el cambio de elementos por página
  const handleItemsPerPageChange = useCallback(
    (perPage: number) => {
      onItemsPerPageChange(perPage)
      toast.success(`Mostrando ${perPage} facturas por página`)
    },
    [onItemsPerPageChange],
  )

  return (
    <>
      <div className="flex justify-end mb-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-9">
              {itemsPerPage} por página
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => handleItemsPerPageChange(5)}>5 por página</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleItemsPerPageChange(10)}>10 por página</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleItemsPerPageChange(20)}>20 por página</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleItemsPerPageChange(50)}>50 por página</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
                <InvoiceTableRow
                  key={invoice.id}
                  invoice={invoice}
                  onViewDetails={handleViewDetails}
                  onConfirm={handleOpenConfirmDialog}
                  onReject={handleOpenRejectDialog}
                  onRetry={handleRetry}
                  isActionLoading={isLoading}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Diálogo de confirmación */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar factura</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas confirmar esta factura? Esto iniciará el procesamiento completo.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirm} disabled={isLoading}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de rechazo */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar factura</DialogTitle>
            <DialogDescription>Por favor, proporciona un motivo para rechazar esta factura.</DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Motivo del rechazo"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleReject} disabled={!rejectReason.trim() || isLoading}>
              Rechazar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de detalles de factura */}
      <InvoiceDetailsModal invoiceId={viewingInvoiceId} open={detailsModalOpen} onOpenChange={setDetailsModalOpen} />
    </>
  )
}
