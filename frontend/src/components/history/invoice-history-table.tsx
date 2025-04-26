"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { InvoiceDetailView } from "@/components/dashboard/invoice-detail-view"
import { Eye, Download, RotateCw, Check, X, ExternalLink, ArrowUp, ArrowDown } from 'lucide-react'
import { cn, formatDate } from "@/lib/utils"
import { useInvoiceActions } from "@/hooks/use-invoice-actions"
import { RejectDialog } from "@/components/reject-dialog"
import { downloadInvoice } from "@/lib/api"
import { toast } from "sonner"
import { motion } from "framer-motion"

interface InvoiceHistoryTableProps {
  invoices: any[]
  isLoading: boolean
  error: string | null
  sortBy?: string
  sortOrder?: "asc" | "desc"
  onSortChange: (sortBy: string, sortOrder: "asc" | "desc") => void
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

export function InvoiceHistoryTable({ 
  invoices, 
  isLoading, 
  error, 
  sortBy = "created_at", 
  sortOrder = "desc",
  onSortChange 
}: InvoiceHistoryTableProps) {
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
  const [invoiceToReject, setInvoiceToReject] = useState<number | null>(null)

  const { retryInvoice, confirmInvoice, rejectInvoice, isRetrying, isConfirming, isRejecting } = useInvoiceActions()

  const handleSort = (column: string) => {
    if (sortBy === column) {
      // Toggle sort order if clicking the same column
      onSortChange(column, sortOrder === "asc" ? "desc" : "asc")
    } else {
      // Default to descending for new column
      onSortChange(column, "desc")
    }
  }

  const handleRetry = async (id: number) => {
    await retryInvoice(id)
  }

  const handleConfirm = async (id: number) => {
    await confirmInvoice(id)
  }

  const handleRejectClick = (id: number) => {
    setInvoiceToReject(id)
    setIsRejectDialogOpen(true)
  }

  const handleReject = async (reason: string) => {
    if (invoiceToReject) {
      await rejectInvoice(invoiceToReject, reason)
    }
    setIsRejectDialogOpen(false)
    setInvoiceToReject(null)
  }

  const handleDownload = async (id: number) => {
    try {
      const blob = await downloadInvoice(id)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.style.display = "none"
      a.href = url
      a.download = `invoice-${id}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      toast.success(`Downloading invoice #${id}`)
    } catch (error) {
      toast.error("Failed to download invoice")
    }
  }

  const handleView = (id: number) => {
    setSelectedInvoiceId(id)
    setIsDetailOpen(true)
  }

  // Define available actions based on status
  const getAvailableActions = (status: string) => {
    const actionMap: Record<string, string[]> = {
      processed: ["view", "download"],
      waiting_validation: ["confirm", "reject", "view", "download"],
      processing: ["download"],
      failed: ["view", "retry"],
      rejected: ["retry", "view", "download"],
      duplicated: ["redirect", "download"],
    }
    return actionMap[status] || ["view"]
  }

  if (isLoading) {
    return (
      <Card className="mt-6">
        <div className="p-4">
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            {Array(5)
              .fill(0)
              .map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
          </div>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="mt-6">
        <div className="flex flex-col items-center justify-center p-6 text-center">
          <div className="rounded-full bg-red-100 p-3 dark:bg-red-900">
            <X className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">Error Loading Invoices</h3>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          <Button className="mt-4" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </Card>
    )
  }

  if (invoices.length === 0) {
    return (
      <Card className="mt-6">
        <div className="flex flex-col items-center justify-center p-6 text-center">
          <div className="rounded-full bg-muted p-3">
            <ExternalLink className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No Invoices Found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            No invoices match your current filters. Try adjusting your search criteria.
          </p>
        </div>
      </Card>
    )
  }

  return (
    <>
      <Card className="mt-6 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="w-[100px] cursor-pointer"
                  onClick={() => handleSort("id")}
                >
                  <div className="flex items-center">
                    ID
                    {sortBy === "id" && (
                      sortOrder === "asc" ? 
                        <ArrowUp className="ml-1 h-4 w-4" /> : 
                        <ArrowDown className="ml-1 h-4 w-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort("filename")}
                >
                  <div className="flex items-center">
                    Filename
                    {sortBy === "filename" && (
                      sortOrder === "asc" ? 
                        <ArrowUp className="ml-1 h-4 w-4" /> : 
                        <ArrowDown className="ml-1 h-4 w-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort("status")}
                >
                  <div className="flex items-center">
                    Status
                    {sortBy === "status" && (
                      sortOrder === "asc" ? 
                        <ArrowUp className="ml-1 h-4 w-4" /> : 
                        <ArrowDown className="ml-1 h-4 w-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort("created_at")}
                >
                  <div className="flex items-center">
                    Date
                    {sortBy === "created_at" && (
                      sortOrder === "asc" ? 
                        <ArrowUp className="ml-1 h-4 w-4" /> : 
                        <ArrowDown className="ml-1 h-4 w-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice, index) => {
                const availableActions = getAvailableActions(invoice.status)
                
                return (
                  <motion.tr
                    key={invoice.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    className="group hover:bg-muted/50"
                  >
                    <TableCell className="font-medium">{invoice.id}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{invoice.filename}</TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell>{formatDate(invoice.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        {availableActions.includes("retry") && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-70 group-hover:opacity-100"
                            onClick={() => handleRetry(invoice.id)}
                            disabled={isRetrying}
                          >
                            <RotateCw
                              className={cn("h-4 w-4", isRetrying && invoice.id === invoiceToReject && "animate-spin")}
                            />
                            <span className="sr-only">Retry</span>
                          </Button>
                        )}
                        {availableActions.includes("view") && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-70 group-hover:opacity-100"
                            onClick={() => handleView(invoice.id)}
                          >
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">View</span>
                          </Button>
                        )}
                        {availableActions.includes("download") && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-70 group-hover:opacity-100"
                            onClick={() => handleDownload(invoice.id)}
                          >
                            <Download className="h-4 w-4" />
                            <span className="sr-only">Download</span>
                          </Button>
                        )}
                        {availableActions.includes("redirect") && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-70 group-hover:opacity-100"
                            onClick={() => toast.info("Redirecting to original invoice")}
                          >
                            <ExternalLink className="h-4 w-4" />
                            <span className="sr-only">Redirect</span>
                          </Button>
                        )}
                        {availableActions.includes("confirm") && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-green-600 opacity-70 group-hover:opacity-100"
                            onClick={() => handleConfirm(invoice.id)}
                            disabled={isConfirming}
                          >
                            <Check
                              className={cn(
                                "h-4 w-4",
                                isConfirming && invoice.id === invoiceToReject && "animate-spin",
                              )}
                            />
                            <span className="sr-only">Confirm</span>
                          </Button>
                        )}
                        {availableActions.includes("reject") && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 opacity-70 group-hover:opacity-100"
                            onClick={() => handleRejectClick(invoice.id)}
                            disabled={isRejecting}
                          >
                            <X className="h-4 w-4" />
                            <span className="sr-only">Reject</span>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </motion.tr>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-4xl p-0 max-h-[90vh] overflow-hidden">
          {selectedInvoiceId && (
            <InvoiceDetailView
              invoiceId={selectedInvoiceId}
              onClose={() => setIsDetailOpen(false)}
              onActionComplete={() => window.location.reload()}
            />
          )}
        </DialogContent>
      </Dialog>

      <RejectDialog
        isOpen={isRejectDialogOpen}
        onClose={() => setIsRejectDialogOpen(false)}
        onConfirm={handleReject}
        invoiceId={invoiceToReject || 0}
      />
    </>
  )
}

