"use client"
import { useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { ErrorAlert } from "@/components/ui/error-alert"
import { useInvoiceDetails } from "@/hooks/api/useInvoiceDetails"
import { CheckCircle, Clock, XCircle } from 'lucide-react'

interface InvoiceDetailsModalProps {
  invoiceId: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InvoiceDetailsModal({ invoiceId, open, onOpenChange }: InvoiceDetailsModalProps) {
  const { details, isLoading, error, fetchInvoiceDetails } = useInvoiceDetails()

  useEffect(() => {
    if (open && invoiceId) {
      fetchInvoiceDetails(invoiceId)
    }
  }, [open, invoiceId, fetchInvoiceDetails])

  const formatCurrency = (amount: number, currency: string = "ARS") => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: currency,
    }).format(amount)
  }

  const getStatusIcon = (status: string) => {
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

  const getStatusBadge = (status: string) => {
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
            {status}
          </Badge>
        )
    }
  }

  // Agrupar los números de publicidad de todos los items
  const getAllAdvertisingNumbers = () => {
    if (!details?.final_data?.items) return []
    
    const allNumbers: string[] = []
    details.final_data.items.forEach(item => {
      if (item.advertising_numbers) {
        item.advertising_numbers.forEach(number => {
          if (!allNumbers.includes(number)) {
            allNumbers.push(number)
          }
        })
      }
    })
    
    return allNumbers
  }

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-4 py-4">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-[200px] w-full" />
        </div>
      )
    }

    if (error) {
      return <ErrorAlert title="Error" message={error} />
    }

    if (!details) {
      return <p className="text-center py-4 text-muted-foreground">No se encontraron detalles de la factura</p>
    }

    const { final_data, status } = details
    const advertisingNumbers = getAllAdvertisingNumbers()

    return (
      <div className="space-y-6 py-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Factura #{final_data.invoice_number}</h3>
            <p className="text-sm text-muted-foreground">
              {final_data.date} • {final_data.payment_terms}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon(status)}
            {getStatusBadge(status)}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Información general</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-muted-foreground">Cliente:</div>
              <div>{final_data.bill_to}</div>
              <div className="text-muted-foreground">Moneda:</div>
              <div>{final_data.currency}</div>
              <div className="text-muted-foreground">Total:</div>
              <div className="font-semibold">{formatCurrency(final_data.amount_total, final_data.currency)}</div>
            </div>
          </div>

          {advertisingNumbers.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Números de publicidad</h4>
              <div className="flex flex-wrap gap-2">
                {advertisingNumbers.map((number, index) => (
                  <Badge key={index} variant="outline">
                    {number}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <Separator />

        <div className="space-y-2">
          <h4 className="text-sm font-medium">Detalle de items</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descripción</TableHead>
                <TableHead>Números de publicidad</TableHead>
                <TableHead className="text-right">Importe</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {final_data.items.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>
                    {item.advertising_numbers && (
                      <div className="flex flex-wrap gap-1">
                        {item.advertising_numbers.map((number, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {number}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(item.amount, final_data.currency)}</TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={2} className="text-right font-medium">
                  Total
                </TableCell>
                <TableCell className="text-right font-bold">
                  {formatCurrency(final_data.amount_total, final_data.currency)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Detalles de la Factura</DialogTitle>
          <DialogDescription>
            Información detallada de la factura y sus items
          </DialogDescription>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  )
}
