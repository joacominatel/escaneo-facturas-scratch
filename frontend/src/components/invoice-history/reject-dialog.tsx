import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { AlertCircle } from 'lucide-react'

interface RejectDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (reason: string) => void
  invoiceId: number
}

export function RejectDialog({ isOpen, onClose, onConfirm, invoiceId }: RejectDialogProps) {
  const [reason, setReason] = useState("")
  const [error, setError] = useState(false)

  const handleConfirm = () => {
    if (!reason.trim()) {
      setError(true)
      return
    }
    onConfirm(reason)
    setReason("")
    setError(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose} >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Rechazar Factura #{invoiceId}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="reason" className="text-sm font-medium">
            Motivo del rechazo
          </Label>
          <Textarea
            id="reason"
            value={reason}
            onChange={(e) => {
              setReason(e.target.value)
              setError(false)
            }}
            placeholder="Ingrese el motivo del rechazo..."
            className={`mt-2 ${error ? 'border-red-500' : ''}`}
          />
          {error && (
            <div className="flex items-center gap-2 mt-2 text-red-500 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>El motivo es requerido</span>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} className="bg-red-500 hover:bg-red-600">
            Rechazar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 