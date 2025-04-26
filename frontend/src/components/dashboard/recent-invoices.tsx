"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Eye, Download, RotateCw, Check, X, ExternalLink } from "lucide-react"
import { fetchRecentInvoices, downloadInvoice, retryInvoiceProcessing } from "@/lib/api"
import { InvoiceDetailView } from "@/components/dashboard/invoice-detail-view"
import { toast } from "sonner"
import { cn, formatDate } from "@/lib/utils"
import { motion } from "framer-motion"

interface InvoiceStatus {
  label: string
  value: string
  variant: "default" | "outline" | "secondary" | "destructive" | null
}

// Update the status map to include all status types with appropriate styling
const statusMap: Record<string, InvoiceStatus> = {
  processed: { label: "Processed", value: "processed", variant: "default" },
  waiting_validation: { label: "Waiting Validation", value: "waiting_validation", variant: "secondary" },
  processing: { label: "Processing", value: "processing", variant: "secondary" },
  failed: { label: "Failed", value: "failed", variant: "destructive" },
  rejected: { label: "Rejected", value: "rejected", variant: "outline" },
  duplicated: { label: "Duplicated", value: "duplicated", variant: "outline" },
}

interface RecentInvoicesProps {
  className?: string
}

export function RecentInvoices({ className }: RecentInvoicesProps) {
  const [invoices, setInvoices] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  useEffect(() => {
    const getRecentInvoices = async () => {
      try {
        setIsLoading(true)
        const data = await fetchRecentInvoices()
        setInvoices(data)
      } catch (err) {
        console.error("Failed to fetch recent invoices:", err)
        toast("Failed to load recent invoices. Using sample data instead.")
        // Fallback data
        setInvoices(generateSampleInvoices())
      } finally {
        setIsLoading(false)
      }
    }

    getRecentInvoices()
  }, [])

  // Update the sample invoices to include the new status types
  const generateSampleInvoices = () => {
    return [
      {
        id: 1,
        filename: "INV-2023-001.pdf",
        created_at: "2023-04-15T10:30:00",
        status: "processed",
      },
      {
        id: 2,
        filename: "INV-2023-002.pdf",
        created_at: "2023-04-14T14:45:00",
        status: "waiting_validation",
      },
      {
        id: 3,
        filename: "INV-2023-003.pdf",
        created_at: "2023-04-12T09:15:00",
        status: "failed",
      },
      {
        id: 4,
        filename: "INV-2023-004.pdf",
        created_at: "2023-04-10T16:20:00",
        status: "processing",
      },
      {
        id: 5,
        filename: "INV-2023-005.pdf",
        created_at: "2023-04-08T11:05:00",
        status: "duplicated",
      },
    ]
  }

  const handleRetry = async (id: number) => {
    try {
      await retryInvoiceProcessing(id)
      toast(`Retrying processing for invoice #${id}`)
      // Refresh the list after retry
      const data = await fetchRecentInvoices()
      setInvoices(data)
    } catch (error) {
      toast("Failed to retry invoice processing")
    }
  }

  const handleDownload = async (id: number) => {
    try {
      const blob = await downloadInvoice(id)
      // Create a download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.style.display = "none"
      a.href = url
      a.download = `invoice-${id}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      toast(`Downloading invoice #${id}`)
    } catch (error) {
      toast("Failed to download invoice")
    }
  }

  const handleView = (id: number) => {
    setSelectedInvoiceId(id)
    setIsDetailOpen(true)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className={cn("", className)}
    >
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Recent Invoices</CardTitle>
          <CardDescription>Latest invoices processed by the system</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array(5)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-md" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-4 w-[150px]" />
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="space-y-4">
              {invoices.map((invoice, index) => {
                // Define background color based on status
                const getStatusBackground = (status: string) => {
                  const bgMap: Record<string, string> = {
                    processed:
                      "bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800",
                    waiting_validation:
                      "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800",
                    processing:
                      "bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800",
                    failed:
                      "bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-red-200 dark:border-red-800",
                    rejected:
                      "bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800",
                    duplicated:
                      "bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 border-amber-200 dark:border-amber-800",
                  }
                  return bgMap[status] || ""
                }

                // Define available actions based on status
                const getAvailableActions = (status: string) => {
                  const actionMap: Record<string, string[]> = {
                    processed: ["view", "download"],
                    waiting_validation: ["confirm", "reject", "view", "download", "retry"],
                    processing: ["download"],
                    failed: ["view", "retry"],
                    rejected: ["retry", "view", "download"],
                    duplicated: ["redirect", "download"],
                  }
                  return actionMap[status] || ["view"]
                }

                const availableActions = getAvailableActions(invoice.status)

                return (
                  <motion.div
                    key={invoice.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className={cn(
                      "flex flex-col space-y-2 rounded-md border p-3 text-sm",
                      getStatusBackground(invoice.status),
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{invoice.filename}</div>
                      <Badge variant={statusMap[invoice.status]?.variant || "default"}>
                        {statusMap[invoice.status]?.label || invoice.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground">
                      <div>ID: {invoice.id}</div>
                      <div>{formatDate(invoice.created_at)}</div>
                    </div>
                    <div className="flex items-center justify-end">
                      <div className="flex space-x-2">
                        {availableActions.includes("retry") && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleRetry(invoice.id)}
                          >
                            <RotateCw className="h-4 w-4" />
                            <span className="sr-only">Retry</span>
                          </Button>
                        )}
                        {availableActions.includes("view") && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
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
                            className="h-8 w-8"
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
                            className="h-8 w-8"
                            onClick={() => toast("Redirecting to original invoice")}
                          >
                            <ExternalLink className="h-4 w-4" />
                            <span className="sr-only">Redirect</span>
                          </Button>
                        )}
                        {availableActions.includes("confirm") && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-green-600"
                            onClick={() => toast(`Confirming invoice #${invoice.id}`)}
                          >
                            <Check className="h-4 w-4" />
                            <span className="sr-only">Confirm</span>
                          </Button>
                        )}
                        {availableActions.includes("reject") && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600"
                            onClick={() => toast(`Rejecting invoice #${invoice.id}`)}
                          >
                            <X className="h-4 w-4" />
                            <span className="sr-only">Reject</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
          {!isLoading && invoices.length > 0 && (
            <Button variant="outline" className="mt-4 w-full">
              View All Invoices
            </Button>
          )}
          {!isLoading && invoices.length === 0 && (
            <div className="flex h-[200px] items-center justify-center rounded-md border border-dashed">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">No recent invoices found</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-4xl p-0 max-h-[90vh] overflow-hidden">
          {selectedInvoiceId && (
            <InvoiceDetailView invoiceId={selectedInvoiceId} onClose={() => setIsDetailOpen(false)} />
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
