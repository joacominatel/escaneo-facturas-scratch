"use client"

import { memo } from "react"
import { TableCell, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Download, Eye } from "lucide-react"
import { getStatusIcon, getStatusBadgeClassNames, getStatusLabel } from "@/lib/status-utils"
import { downloadInvoice } from "@/lib/invoice-utils"
import { InvoiceActions } from "@/components/History/invoice-actions"
import { toast } from "sonner"
import { Checkbox } from "@/components/ui/checkbox"
import type { InvoiceStatus } from "@/types/invoice"

interface Invoice {
  id: number
  filename: string
  status: string
  created_at: string
}

interface InvoiceRowProps {
  invoice: Invoice
  onViewDetails: (id: number) => void
  onRetry: (id: number) => void
  onRefresh: () => void
  isSelected?: boolean
  onToggleSelect?: (id: number) => void
  selectionMode?: boolean
}

export const InvoiceRow = memo(function InvoiceRow({ 
  invoice, 
  onViewDetails, 
  onRetry, 
  onRefresh,
  isSelected = false,
  onToggleSelect,
  selectionMode = false
}: InvoiceRowProps) {
  const isPending = invoice.status === "waiting_validation"
  const isFailedOrRejected = invoice.status === "failed" || invoice.status === "rejected"

  return (
    <TableRow className={`hover:bg-muted/50 ${isSelected ? 'bg-muted/30' : ''}`}>
      {selectionMode && (
        <TableCell className="w-10 pr-0">
          <Checkbox 
            checked={isSelected}
            onCheckedChange={() => onToggleSelect?.(invoice.id)}
            aria-label={`Seleccionar factura ${invoice.id}`}
          />
        </TableCell>
      )}
      <TableCell>{invoice.id}</TableCell>
      <TableCell className="max-w-[200px] truncate">{invoice.filename}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          {getStatusIcon(invoice.status as InvoiceStatus)}
          <Badge variant="outline" className={getStatusBadgeClassNames(invoice.status as InvoiceStatus)}>
            {getStatusLabel(invoice.status as InvoiceStatus)}
          </Badge>
        </div>
      </TableCell>
      <TableCell>
        {new Date(invoice.created_at).toLocaleDateString("es-ES", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end space-x-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            title="Ver detalles"
            onClick={() => onViewDetails(invoice.id)}
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
          
          {isFailedOrRejected && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title="Reintentar"
              onClick={() => onRetry(invoice.id)}
            >
              {getStatusIcon("processing")}
            </Button>
          )}
          
          {isPending && (
            <InvoiceActions 
              invoiceId={invoice.id}
              onActionComplete={onRefresh}
            />
          )}
        </div>
      </TableCell>
    </TableRow>
  )
})