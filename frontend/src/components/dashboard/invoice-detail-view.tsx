"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DialogTitle } from "@/components/ui/dialog"
import { Download, Check, X } from 'lucide-react'
import { fetchInvoiceDetails } from "@/lib/api"
import { toast } from "sonner"
import { cn, formatDate, formatCurrency } from "@/lib/utils"
import { motion } from "framer-motion"

interface InvoiceDetailViewProps {
  invoiceId: number
  onClose: () => void
  className?: string
}

// Status badge mapping
const getStatusBadge = (status: string) => {
  const statusMap: Record<string, { label: string; variant: "default" | "outline" | "secondary" | "destructive" }> = {
    processed: { label: "Processed", variant: "default" },
    waiting_validation: { label: "Waiting Validation", variant: "secondary" },
    processing: { label: "Processing", variant: "secondary" },
    failed: { label: "Failed", variant: "destructive" },
    rejected: { label: "Rejected", variant: "outline" },
    duplicated: { label: "Duplicated", variant: "outline" },
  }

  const statusInfo = statusMap[status] || { label: status, variant: "default" }

  return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
}

export function InvoiceDetailView({ invoiceId, onClose, className }: InvoiceDetailViewProps) {
  const [invoice, setInvoice] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const getInvoiceDetails = async () => {
      try {
        setIsLoading(true)
        const data = await fetchInvoiceDetails(invoiceId)
        setInvoice(data)
      } catch (err) {
        console.error("Failed to fetch invoice details:", err)
        toast("Failed to load invoice details")
      } finally {
        setIsLoading(false)
      }
    }

    getInvoiceDetails()
  }, [invoiceId])

  const handleConfirm = () => {
    toast("Invoice confirmed successfully")
    onClose()
  }

  const handleReject = () => {
    toast("Invoice rejected")
    onClose()
  }

  if (isLoading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-8 w-48" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-32" />
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {Array(5)
              .fill(0)
              .map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!invoice) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle>Invoice Not Found</CardTitle>
          <CardDescription>The requested invoice could not be found</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onClose}>Close</Button>
        </CardContent>
      </Card>
    )
  }

  const invoiceData = invoice.preview || invoice.final_data || {}
  const items = invoiceData.items || []
  const operationCodes = invoiceData.operation_codes || []

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className={cn("w-full", className)}
    >
      <Card className="shadow-lg max-h-[80vh] overflow-hidden flex flex-col">
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <DialogTitle className="text-xl">Invoice #{invoiceData.invoice_number || invoice.invoice_id}</DialogTitle>
            <CardDescription className="mt-1 flex items-center gap-2">
              {invoiceData.date && formatDate(invoiceData.date)}
              {getStatusBadge(invoice.status)}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 overflow-y-auto pb-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-muted-foreground">Bill To</h3>
              <p className="text-sm">{invoiceData.bill_to || "Not specified"}</p>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-muted-foreground">Amount</h3>
              <p className="text-lg font-semibold">
                {formatCurrency(invoiceData.amount_total || 0, invoiceData.currency || "USD")}
              </p>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-muted-foreground">Payment Terms</h3>
              <p className="text-sm">{invoiceData.payment_terms || "Not specified"}</p>
            </div>
          </div>

          <Tabs defaultValue="items">
            <TabsList>
              <TabsTrigger value="items">Items ({items.length})</TabsTrigger>
              <TabsTrigger value="operations">Operation Codes ({operationCodes.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="items" className="mt-4">
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead>Operation Code</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.length > 0 ? (
                      items.map((item: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.description}</TableCell>
                          <TableCell>
                            {item.advertising_numbers && item.advertising_numbers.length > 0
                              ? item.advertising_numbers.join(", ")
                              : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(item.amount || 0, invoiceData.currency || "USD")}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                          No items found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            <TabsContent value="operations" className="mt-4">
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Operation Code</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {operationCodes.length > 0 ? (
                      operationCodes.map((op: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{op.code}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(op.amount || 0, invoiceData.currency || "USD")}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center py-4 text-muted-foreground">
                          No operation codes found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>

          {invoice.status === "waiting_validation" && (
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={handleReject}>
                <X className="mr-2 h-4 w-4" />
                Reject
              </Button>
              <Button onClick={handleConfirm}>
                <Check className="mr-2 h-4 w-4" />
                Confirm
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
