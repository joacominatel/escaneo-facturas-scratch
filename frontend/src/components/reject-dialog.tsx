"use client"

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
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = () => {
    if (!reason.trim()) {
      setError("Please provide a reason for rejection")
      return
    }
    onConfirm(reason)
    setReason("")
    setError(null)
  }

  const handleClose = () => {
    setReason("")
    setError(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reject Invoice #{invoiceId}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="reason">Reason for rejection</Label>
            <Textarea
              id="reason"
              placeholder="Please provide a reason for rejecting this invoice..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[100px]"
            />
            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm mt-1">
                <AlertCircle className="h-4 w-4" />
                <p>{error}</p>
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} variant="destructive">
            Reject Invoice
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
