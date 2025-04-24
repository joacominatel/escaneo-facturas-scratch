"use client"

import { useState, useEffect, useCallback } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { ArrowUpRight, ArrowRight, Loader2, Download, Eye } from 'lucide-react'
import { useInvoicesList, useInvoiceActions } from "@/hooks/api"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from 'lucide-react'
import { toast } from "sonner"
import { InvoiceDetailsModal } from "@/components/invoice-details-modal"
import { downloadInvoice } from "@/lib/invoice-utils"
import { getStatusIcon, getStatusBadgeClassNames, getStatusLabel } from "@/lib/status-utils"
import type { InvoiceStatus } from "@/types/invoice"

interface Invoice {
  id: number
  filename: string
  status: string
  created_at: string
  original_invoice_id?: number | null
}

export function RecentInvoices() {
  const { invoices, isLoading, error, updateParams, refreshInvoices } = useInvoicesList({
    per_page: 5,
  })
  const { confirmInvoice, rejectInvoice, retryInvoice, isLoading: isActionLoading } = useInvoiceActions()
  const [selectedInvoice, setSelectedInvoice] = useState<number | null>(null)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [viewingInvoiceId, setViewingInvoiceId] = useState<number | null>(null)
  const [searchingInvoice, setSearchingInvoice] = useState<string | null>(null)
  const [searchResults, setSearchResults] = useState<Invoice[]>([])
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    // Actualizar cada 30 segundos
    const interval = setInterval(() => {
      updateParams({ per_page: 5 })
    }, 30000)

    return () => clearInterval(interval)
  }, [updateParams])

  // Función para manejar la confirmación de una factura
  const handleConfirm = async () => {
    if (!selectedInvoice) return

    try {
      await confirmInvoice(selectedInvoice)
      toast.success("Factura confirmada correctamente")
      setConfirmDialogOpen(false)
      refreshInvoices()
    } catch (error) {
      toast.error("Error al confirmar la factura")
    }
  }

  // Función para manejar el rechazo de una factura
  const handleReject = async () => {
    if (!selectedInvoice || !rejectReason.trim()) return

    try {
      await rejectInvoice(selectedInvoice, rejectReason)
      toast.success("Factura rechazada correctamente")
      setRejectDialogOpen(false)
      setRejectReason("")
      refreshInvoices()
    } catch (error) {
      toast.error("Error al rechazar la factura")
    }
  }

  // Función para manejar el reintento de una factura
  const handleRetry = async (invoiceId: number) => {
    try {
      await retryInvoice(invoiceId)
      toast.success("Procesamiento de factura reiniciado")
      refreshInvoices()
    } catch (error) {
      toast.error("Error al reintentar el procesamiento")
    }
  }

  // Función para abrir el modal de detalles
  const handleViewDetails = (invoiceId: number) => {
    setViewingInvoiceId(invoiceId)
    setDetailsModalOpen(true)
  }

  // Función para buscar la factura original
  const handleFindOriginal = useCallback(
    async (invoice: Invoice) => {
      if (invoice.original_invoice_id) {
        // Si ya tenemos el ID de la factura original, mostrar directamente sus detalles
        setViewingInvoiceId(invoice.original_invoice_id)
        setDetailsModalOpen(true)
        return
      }

      // Si no tenemos el ID, buscar por nombre
      setSearchingInvoice(invoice.filename)
      setIsSearching(true)

      // Extraer el nombre base del archivo sin extensión
      const baseFilename = invoice.filename.replace(/\.[^/.]+$/, "")

      toast.info("Buscando factura original", {
        description: `Buscando facturas relacionadas con "${baseFilename}"`,
      })

      try {
        // Realizar la búsqueda
        await updateParams({
          search: baseFilename,
          page: 1,
          per_page: 10,
          status: "processed", // Buscar solo entre facturas procesadas
        })

        const result = await useInvoicesList({
          search: baseFilename,
          page: 1,
          per_page: 10,
          status: "processed",
        });

        if (result?.invoices?.length > 0) {
          // Filtrar para excluir la factura actual
          const filteredResults = result.invoices.filter(
            (resultInvoice) => resultInvoice.id !== invoice.id && resultInvoice.status === "processed"
          )

          setSearchResults(filteredResults)

          if (filteredResults.length === 1) {
            // Si solo hay un resultado, mostrar directamente sus detalles
            setViewingInvoiceId(filteredResults[0].id)
            setDetailsModalOpen(true)
            toast.success("Factura original encontrada", {
              description: `Se ha encontrado la factura original: ${filteredResults[0].filename}`,
            })
          } else if (filteredResults.length > 1) {
            toast.success(`Se encontraron ${filteredResults.length} facturas relacionadas`, {
              description: "Seleccione una para ver los detalles",
            })
          } else {
            toast.error("No se encontró la factura original", {
              description: "No hay facturas procesadas que coincidan con este nombre",
            })
          }
        } else {
          toast.error("No se encontró la factura original", {
            description: "No hay facturas procesadas que coincidan con este nombre",
          })
        }
      } catch (error) {
        toast.error("Error al buscar la factura original", {
          description: "Ocurrió un error durante la búsqueda",
        })
      } finally {
        // Restaurar la lista original después de un breve retraso
        setTimeout(() => {
          updateParams({ per_page: 5, page: 1 })
          setIsSearching(false)
          setSearchingInvoice(null)
        }, 500)
      }
    },
    [updateParams, setViewingInvoiceId, setDetailsModalOpen]
  )

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className="h-auto">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error al cargar facturas recientes</AlertTitle>
        <AlertDescription className="flex flex-col gap-2">
          <p>{error}</p>
          <Button variant="outline" size="sm" className="w-fit mt-2" onClick={() => refreshInvoices()}>
            <AlertCircle className="h-4 w-4 mr-2" />
            Reintentar
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  if (!invoices.length) {
    return (
      <div className="flex flex-col items-center justify-center h-[200px] gap-4">
        <p className="text-muted-foreground">No hay facturas recientes</p>
        <Button variant="outline" size="sm" onClick={() => refreshInvoices()}>
          <AlertCircle className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Mostrar resultados de búsqueda si hay alguno */}
      {searchResults.length > 0 && (
        <Alert className="bg-blue-50 border-blue-200 mb-4">
          <AlertTitle className="text-blue-700">Resultados de búsqueda</AlertTitle>
          <AlertDescription>
            <p className="mb-2">Se encontraron {searchResults.length} facturas relacionadas:</p>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {searchResults.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-2 rounded-md bg-white hover:bg-blue-100 cursor-pointer"
                  onClick={() => {
                    setViewingInvoiceId(invoice.id)
                    setDetailsModalOpen(true)
                    setSearchResults([])
                  }}
                >
                  <span className="text-sm font-medium">{invoice.filename}</span>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => {
                setSearchResults([])
                updateParams({ per_page: 5, page: 1 })
              }}
            >
              Cerrar resultados
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        {invoices.map((invoice) => (
          <div key={invoice.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
            <div className="flex items-center space-x-3">
              {getStatusIcon(invoice.status as InvoiceStatus)}
              <div>
                <p className="text-sm font-medium">{invoice.filename}</p>
                <p className="text-xs text-muted-foreground">{new Date(invoice.created_at).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant="outline" className={getStatusBadgeClassNames(invoice.status as InvoiceStatus)}>
                    {getStatusLabel(invoice.status as InvoiceStatus)}
                  </Badge>

                  {/* Add arrow indicator for duplicated invoices */}
                  {invoice.status === "duplicated" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 rounded-full transition-all hover:scale-110 hover:bg-blue-100"
                      title="Buscar factura original"
                      onClick={() => handleFindOriginal(invoice as Invoice)}
                      disabled={isSearching}
                    >
                      {searchingInvoice === invoice.filename ? (
                        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                      ) : (
                        <ArrowRight className="h-4 w-4 text-blue-500" />
                      )}
                    </Button>
                  )}
                </div>
              </div>

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

              {invoice.status === "waiting_validation" && (
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-green-500"
                    title="Confirmar"
                    onClick={() => {
                      setSelectedInvoice(invoice.id)
                      setConfirmDialogOpen(true)
                    }}
                    disabled={isActionLoading}
                  >
                    {getStatusIcon("processed")}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500"
                    title="Rechazar"
                    onClick={() => {
                      setSelectedInvoice(invoice.id)
                      setRejectDialogOpen(true)
                    }}
                    disabled={isActionLoading}
                  >
                    {getStatusIcon("rejected")}
                  </Button>
                </div>
              )}

              {(invoice.status === "failed" || invoice.status === "rejected") && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  title="Reintentar"
                  onClick={() => handleRetry(invoice.id)}
                  disabled={isActionLoading}
                >
                  {getStatusIcon("processing")}
                </Button>
              )}

              <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                <a href={`/invoice/${invoice.id}`}>
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-center">
        <Button variant="outline" size="sm" className="w-full" asChild>
          <a href="?tab=history">Ver todas las facturas</a>
        </Button>
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
            <Button onClick={handleConfirm} disabled={isActionLoading}>
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
            <Button onClick={handleReject} disabled={!rejectReason.trim() || isActionLoading}>
              Rechazar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
    </div>
  )
}
