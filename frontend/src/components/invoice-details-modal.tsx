"use client"

import { useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { ErrorAlert } from "@/components/ui/error-alert"
import { useInvoiceDetails } from "@/hooks/api/useInvoiceDetails"
import { Download, ArrowRight } from "lucide-react"
import { downloadInvoice } from "@/lib/invoice-utils"
import { Button } from "@/components/ui/button"
import { getStatusIcon, getStatusBadgeClassNames, getStatusLabel } from "@/lib/status-utils"
import type { InvoiceStatus } from "@/types/invoice"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface InvoiceDetailsModalProps {
  invoiceId: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onViewOriginal?: (id: number) => void
}

export function InvoiceDetailsModal({ invoiceId, open, onOpenChange, onViewOriginal }: InvoiceDetailsModalProps) {
  const { details, isLoading, error, fetchInvoiceDetails } = useInvoiceDetails()

  useEffect(() => {
    if (open && invoiceId) {
      fetchInvoiceDetails(invoiceId)
    }
  }, [open, invoiceId, fetchInvoiceDetails])

  const formatCurrency = (amount: number, currency = "ARS") => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: currency,
    }).format(amount)
  }

  // Obtener los datos de la factura (ya sea de final_data o preview)
  const getInvoiceData = () => {
    if (!details) return null

    // Si final_data existe, usarlo; de lo contrario, usar preview
    return details.final_data || details.preview
  }

  // Agrupar los números de publicidad de todos los items
  const getAllAdvertisingNumbers = () => {
    const invoiceData = getInvoiceData()
    if (!invoiceData?.items) return []

    const allNumbers: string[] = []
    invoiceData.items.forEach((item) => {
      if (item.advertising_numbers) {
        item.advertising_numbers.forEach((number) => {
          if (!allNumbers.includes(number)) {
            allNumbers.push(number)
          }
        })
      }
    })

    return allNumbers
  }

  const handleViewOriginal = () => {
    if (details?.original_invoice_id && onViewOriginal) {
      onViewOriginal(details.original_invoice_id)
    }
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

    const invoiceData = getInvoiceData()
    if (!invoiceData) {
      return <p className="text-center py-4 text-muted-foreground">No hay datos disponibles para esta factura</p>
    }

    const { status } = details
    const advertisingNumbers = getAllAdvertisingNumbers()
    const dataSource = details.final_data ? "final" : "preview"
    const isDuplicated = status === "duplicated"

    return (
      <div className="space-y-6 py-4 max-h-[80vh] overflow-y-auto">
        {/* Mostrar alerta si es una factura duplicada */}
        {isDuplicated && details.original_invoice_id && (
          <Alert className="bg-blue-50 border-blue-200">
            <AlertTitle className="flex items-center gap-2 text-blue-700">Factura duplicada</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>Esta factura ha sido identificada como duplicada.</span>
              <Button
                variant="outline"
                size="sm"
                className="ml-2 border-blue-200 text-blue-700 hover:bg-blue-100"
                onClick={handleViewOriginal}
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                Ver factura original
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Factura #{invoiceData.invoice_number}</h3>
            <p className="text-sm text-muted-foreground">
              {invoiceData.date} • {invoiceData.payment_terms}
              {dataSource === "preview" && (
                <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-700 border-blue-200">
                  Vista previa
                </Badge>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon(status as InvoiceStatus)}
            <Badge variant="outline" className={getStatusBadgeClassNames(status as InvoiceStatus)}>
              {getStatusLabel(status as InvoiceStatus)}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              className="ml-2"
              onClick={() => downloadInvoice(details.invoice_id, `factura-${invoiceData.invoice_number}.pdf`)}
            >
              <Download className="h-4 w-4 mr-2" />
              Descargar
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Información general</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-muted-foreground">Cliente:</div>
              <div>{invoiceData.bill_to}</div>
              <div className="text-muted-foreground">Moneda:</div>
              <div>{invoiceData.currency}</div>
              <div className="text-muted-foreground">Total:</div>
              <div className="font-semibold">{formatCurrency(invoiceData.amount_total, invoiceData.currency)}</div>
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
              {invoiceData.items.map((item, index) => (
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
                  <TableCell className="text-right">{formatCurrency(item.amount, invoiceData.currency)}</TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={2} className="text-right font-medium">
                  Total
                </TableCell>
                <TableCell className="text-right font-bold">
                  {formatCurrency(invoiceData.amount_total, invoiceData.currency)}
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
      <DialogContent className="max-w-4xl sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Detalles de la Factura</DialogTitle>
          <DialogDescription>Información detallada de la factura y sus items</DialogDescription>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  )
}
