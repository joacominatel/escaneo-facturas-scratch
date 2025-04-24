"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle, RefreshCw } from "lucide-react"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog"

interface BulkActionsBarProps {
  selectedCount: number
  onConfirm: () => Promise<void>
  onRetry: () => Promise<void>
  onClear: () => void
  isLoading: boolean
  hasWaitingValidation: boolean
  hasFailedOrRejected: boolean
}

export function BulkActionsBar({
  selectedCount,
  onConfirm,
  onRetry,
  onClear,
  isLoading,
  hasWaitingValidation,
  hasFailedOrRejected
}: BulkActionsBarProps) {
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [retryDialogOpen, setRetryDialogOpen] = useState(false)

  const handleConfirmAction = async () => {
    await onConfirm()
    setConfirmDialogOpen(false)
  }

  const handleRetryAction = async () => {
    await onRetry()
    setRetryDialogOpen(false)
  }

  return (
    <>
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 bg-background border rounded-lg shadow-lg p-4 flex items-center gap-4 min-w-[350px]">
        <div className="text-sm font-medium">
          <span className="text-primary font-bold">{selectedCount}</span> {selectedCount === 1 ? "factura" : "facturas"} seleccionada{selectedCount !== 1 ? "s" : ""}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {hasWaitingValidation && (
            <Button 
              size="sm" 
              variant="outline" 
              className="text-green-600 hover:text-green-700 hover:bg-green-100"
              onClick={() => setConfirmDialogOpen(true)}
              disabled={isLoading}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirmar
            </Button>
          )}

          {hasFailedOrRejected && (
            <Button 
              size="sm" 
              variant="outline"
              className="text-amber-600 hover:text-amber-700 hover:bg-amber-100"
              onClick={() => setRetryDialogOpen(true)}
              disabled={isLoading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reintentar
            </Button>
          )}

          <Button 
            size="sm" 
            variant="ghost"
            onClick={onClear}
            disabled={isLoading}
          >
            Cancelar
          </Button>
        </div>
      </div>

      {/* Diálogo de confirmación en lote */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar facturas</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas confirmar {selectedCount} {selectedCount === 1 ? "factura" : "facturas"}? 
              Esto iniciará el procesamiento completo.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmAction} disabled={isLoading}>
              {isLoading ? "Procesando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de reintento en lote */}
      <Dialog open={retryDialogOpen} onOpenChange={setRetryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reintentar facturas</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas reintentar el procesamiento de {selectedCount} {selectedCount === 1 ? "factura" : "facturas"}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRetryDialogOpen(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button onClick={handleRetryAction} disabled={isLoading}>
              {isLoading ? "Procesando..." : "Reintentar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}