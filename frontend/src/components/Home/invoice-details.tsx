"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"

interface InvoiceItem {
  description: string
  amount: number
  advertising_numbers?: string[]
  quantity?: number | null
  unit_price?: number | null
}

interface InvoiceData {
  invoice_id: number
  invoice_number: string
  amount_total: number
  date: string
  bill_to: string
  currency: string
  payment_terms: string
  advertising_numbers?: string[]
  operation_codes?: string[]
  items: InvoiceItem[]
}

interface InvoiceDetailsProps {
  invoice: InvoiceData
}

export function InvoiceDetails({ invoice }: InvoiceDetailsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: invoice.currency,
    }).format(amount)
  }

  // Agrupar los números de publicidad de todos los items si no hay un array de advertising_numbers en el nivel superior
  const getAllAdvertisingNumbers = () => {
    if (invoice.advertising_numbers) return invoice.advertising_numbers

    const allNumbers: string[] = []
    invoice.items.forEach((item) => {
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

  const advertisingNumbers = getAllAdvertisingNumbers()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Factura #{invoice.invoice_number}</CardTitle>
        <CardDescription>Detalles de la factura procesada</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Información general</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-muted-foreground">Número de factura:</div>
              <div>{invoice.invoice_number}</div>
              <div className="text-muted-foreground">Fecha:</div>
              <div>{invoice.date}</div>
              <div className="text-muted-foreground">Cliente:</div>
              <div>{invoice.bill_to}</div>
              <div className="text-muted-foreground">Términos de pago:</div>
              <div>{invoice.payment_terms}</div>
              <div className="text-muted-foreground">Total:</div>
              <div className="font-semibold">{formatCurrency(invoice.amount_total)}</div>
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
              {invoice.items.map((item, index) => (
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
                  <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
