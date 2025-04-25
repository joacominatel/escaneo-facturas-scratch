"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Eye, Download, RotateCw } from "lucide-react"
import { fetchRecentInvoices } from "@/lib/api"
import { toast } from "sonner"
import { cn, formatDate, formatCurrency } from "@/lib/utils"
import { motion } from "framer-motion"

interface InvoiceStatus {
  label: string
  value: string
  variant: "default" | "outline" | "secondary" | "destructive" | null
}

const statusMap: Record<string, InvoiceStatus> = {
  processed: { label: "Processed", value: "processed", variant: "default" },
  pending: { label: "Pending", value: "pending", variant: "secondary" },
  failed: { label: "Failed", value: "failed", variant: "destructive" },
  rejected: { label: "Rejected", value: "rejected", variant: "outline" },
}

interface RecentInvoicesProps {
  className?: string
}

export function RecentInvoices({ className }: RecentInvoicesProps) {
  const [invoices, setInvoices] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
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
  }, [toast])

  const generateSampleInvoices = () => {
    return [
      {
        id: 1,
        filename: "INV-2023-001.pdf",
        vendor: "Acme Corp",
        amount: 1250.0,
        date: "2023-04-15",
        status: "processed",
      },
      {
        id: 2,
        filename: "INV-2023-002.pdf",
        vendor: "Globex Inc",
        amount: 876.5,
        date: "2023-04-14",
        status: "pending",
      },
      { id: 3, filename: "INV-2023-003.pdf", vendor: "Initech", amount: 2340.75, date: "2023-04-12", status: "failed" },
      {
        id: 4,
        filename: "INV-2023-004.pdf",
        vendor: "Umbrella Corp",
        amount: 1120.25,
        date: "2023-04-10",
        status: "processed",
      },
      {
        id: 5,
        filename: "INV-2023-005.pdf",
        vendor: "Stark Industries",
        amount: 4500.0,
        date: "2023-04-08",
        status: "rejected",
      },
    ]
  }

  const handleRetry = (id: number) => {
    toast(`Retrying processing for invoice #${id}`)
  }

  const handleDownload = (id: number) => {
    toast(`Downloading invoice #${id}`)
  }

  const handleView = (id: number) => {
    toast(`Opening invoice #${id} for viewing`)
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
              {invoices.map((invoice, index) => (
                <motion.div
                  key={invoice.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="flex flex-col space-y-2 rounded-md border p-3 text-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{invoice.filename}</div>
                    <Badge variant={statusMap[invoice.status]?.variant || "default"}>
                      {statusMap[invoice.status]?.label || invoice.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <div>{invoice.vendor}</div>
                    <div>{formatCurrency(invoice.amount)}</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">{formatDate(invoice.date)}</div>
                    <div className="flex space-x-2">
                      {invoice.status === "failed" && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleRetry(invoice.id)}>
                          <RotateCw className="h-4 w-4" />
                          <span className="sr-only">Retry</span>
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleView(invoice.id)}>
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">View</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleDownload(invoice.id)}
                      >
                        <Download className="h-4 w-4" />
                        <span className="sr-only">Download</span>
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
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
    </motion.div>
  )
}
