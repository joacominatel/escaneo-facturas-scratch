"use client"

import { useState } from "react"
import { Check, X, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useInvoiceActions } from "@/hooks/api/useInvoiceActions"

interface InvoiceActionsProps {
  invoiceId: number
  onActionComplete: () => void
}

export function InvoiceActions({ invoiceId, onActionComplete }: InvoiceActionsProps) {
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const { confirmInvoice, rejectInvoice, isLoading } = useInvoiceActions()

  // Handle confirmation
  const handleConfirm = async () => {
    await confirmInvoice(invoiceId)
    onActionComplete()
  }

  // Handle rejection dialog open
  const handleOpenRejectDialog = () => {
    setRejectDialogOpen(true)
  }

  // Handle rejection
  const handleReject = async () => {
    await rejectInvoice(invoiceId, rejectReason)
    setRejectDialogOpen(false)
    setRejectReason("")
    onActionComplete()
  }

  return (
    <>
      <div className="flex items-center space-x-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-100"
          onClick={handleConfirm}
          disabled={isLoading}
          title="Confirmar factura"
        >
          <Check className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-100"
          onClick={handleOpenRejectDialog}
          disabled={isLoading}
          title="Rechazar factura"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar Factura</DialogTitle>
            <DialogDescription>
              Indique el motivo por el cual está rechazando esta factura.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                Esta acción no se puede deshacer. La factura cambiará su estado a "Rechazada".
              </p>
            </div>
            <Textarea
              placeholder="Motivo del rechazo (opcional)"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setRejectDialogOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReject}
              disabled={isLoading}
            >
              {isLoading ? "Rechazando..." : "Rechazar factura"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}