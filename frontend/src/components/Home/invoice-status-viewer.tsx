"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, Clock, RefreshCw, XCircle } from "lucide-react"
import { useInvoiceStatus, useInvoiceWebSocket, useInvoiceActions } from "@/hooks/api"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

interface InvoiceStatusViewerProps {
  invoiceId: number
}

export function InvoiceStatusViewer({ invoiceId }: InvoiceStatusViewerProps) {
  const { status, isLoading, error, refreshStatus } = useInvoiceStatus(invoiceId)
  const { connected, lastEvent } = useInvoiceWebSocket(invoiceId)
  const { confirmInvoice, rejectInvoice, retryInvoice, isLoading: isActionLoading } = useInvoiceActions()
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState("")

  // Actualizar el estado cuando se recibe un evento WebSocket
  useEffect(() => {
    if (lastEvent) {
      refreshStatus()
    }
  }, [lastEvent, refreshStatus])

  const getStatusBadge = () => {
    if (!status) return null

    switch (status.status) {
      case "processed":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Procesada
          </Badge>
        )
      case "waiting_validation":
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            Pendiente de validación
          </Badge>
        )
      case "processing":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            En procesamiento
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
            {status.status}
          </Badge>
        )
    }
  }

  const getStatusIcon = () => {
    if (!status) return null

    switch (status.status) {
      case "processed":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "waiting_validation":
      case "processing":
        return <Clock className="h-5 w-5 text-amber-500" />
      case "failed":
      case "rejected":
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-amber-500" />
    }
  }

  const handleConfirm = async () => {
    await confirmInvoice(invoiceId)
    refreshStatus()
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) return

    await rejectInvoice(invoiceId, rejectReason)
    setRejectDialogOpen(false)
    setRejectReason("")
    refreshStatus()
  }

  const handleRetry = async () => {
    await retryInvoice(invoiceId)
    refreshStatus()
  }

  if (isLoading) {
    return <Skeleton className="h-[200px] w-full" />
  }

  if (error || !status) {
    return (
      <div className="flex items-center justify-center h-[200px]">
        <p className="text-muted-foreground">Error al cargar el estado de la factura</p>
      </div>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="space-y-1">
            <CardTitle className="text-xl">Factura #{invoiceId}</CardTitle>
            <CardDescription className="flex items-center gap-2">
              Estado: {getStatusIcon()} {getStatusBadge()}
              {connected && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 ml-2">
                  En tiempo real
                </Badge>
              )}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={refreshStatus}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Progreso</span>
              <span className="text-sm">{status.progress}%</span>
            </div>
            <Progress value={status.progress} />
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Mensaje</h4>
            <p className="text-sm text-muted-foreground">{status.message}</p>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Eventos</h4>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {status.log_events.map((event, index) => (
                <div key={index} className="text-xs p-1 rounded bg-muted">
                  {event}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            {status.status === "waiting_validation" && (
              <>
                <Button variant="outline" onClick={() => setRejectDialogOpen(true)} disabled={isActionLoading}>
                  Rechazar
                </Button>
                <Button onClick={handleConfirm} disabled={isActionLoading}>
                  Confirmar
                </Button>
              </>
            )}
            {(status.status === "failed" || status.status === "rejected") && (
              <Button onClick={handleRetry} disabled={isActionLoading}>
                Reintentar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

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
    </>
  )
}
