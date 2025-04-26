"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { useInvoiceActions } from "@/hooks/use-invoice-actions"
import { downloadInvoice, fetchRecentInvoices } from "@/lib/api"
import { RejectDialog } from "@/components/reject-dialog"
import { InvoiceDetailView } from "@/components/dashboard/invoice-detail-view"

import { RecentInvoicesProps, Invoice } from "./types"
import { InvoiceItem } from "./InvoiceItem"
import { generateSampleInvoices } from "./utils"

export function RecentInvoices({ className }: RecentInvoicesProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
  const [invoiceToReject, setInvoiceToReject] = useState<number | null>(null)
  const [activeActionId, setActiveActionId] = useState<number | null>(null)

  const { 
    retryInvoice, 
    confirmInvoice, 
    rejectInvoice,
    isRetrying,
    isConfirming,
    isRejecting
  } = useInvoiceActions()

  useEffect(() => {
    fetchInvoices()
  }, [])

  const fetchInvoices = async () => {
    try {
      setIsLoading(true)
      const data = await fetchRecentInvoices()
      setInvoices(data as Invoice[])
    } catch (err) {
      console.error("Failed to fetch recent invoices:", err)
      toast("Failed to load recent invoices. Using sample data instead.")
      setInvoices(generateSampleInvoices() as Invoice[])
    } finally {
      setIsLoading(false)
    }
  }

  const handleRetry = async (id: number) => {
    setActiveActionId(id)
    try {
      const result = await retryInvoice(id)
      if (result) {
        setInvoices(invoices.map(invoice => 
          invoice.id === id ? { ...invoice, status: result.status as any } : invoice
        ))
      }
    } finally {
      setActiveActionId(null)
    }
  }

  const handleConfirm = async (id: number) => {
    setActiveActionId(id)
    try {
      const result = await confirmInvoice(id)
      if (result) {
        setInvoices(invoices.map(invoice => 
          invoice.id === id ? { ...invoice, status: result.status as any } : invoice
        ))
      }
    } finally {
      setActiveActionId(null)
    }
  }

  const handleRejectClick = (id: number) => {
    setInvoiceToReject(id)
    setIsRejectDialogOpen(true)
  }

  const handleReject = async (reason: string) => {
    if (invoiceToReject) {
      setActiveActionId(invoiceToReject)
      try {
        const result = await rejectInvoice(invoiceToReject, reason)
        if (result) {
          setInvoices(invoices.map(invoice => 
            invoice.id === invoiceToReject ? { ...invoice, status: result.status as any } : invoice
          ))
        }
      } finally {
        setActiveActionId(null)
      }
    }
    setIsRejectDialogOpen(false)
    setInvoiceToReject(null)
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

  const handleActionComplete = () => {
    // Refresh the invoice list after an action is completed
    fetchInvoices()
  }

  const renderContent = () => {
    if (isLoading) {
      return (
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
      )
    }

    if (invoices.length === 0) {
      return (
        <div className="flex h-[200px] items-center justify-center rounded-md border border-dashed">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">No recent invoices found</p>
          </div>
        </div>
      )
    }

    return (
      <>
        <div className="space-y-4">
          {invoices.map((invoice, index) => (
            <InvoiceItem
              key={invoice.id}
              invoice={invoice}
              onView={handleView}
              onDownload={handleDownload}
              onRetry={handleRetry}
              onConfirm={handleConfirm}
              onReject={handleRejectClick}
              isRetrying={isRetrying}
              isConfirming={isConfirming}
              isRejecting={isRejecting}
              activeActionId={activeActionId}
            />
          ))}
        </div>
        <Button variant="outline" className="mt-4 w-full">
          View All Invoices
        </Button>
      </>
    )
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
          {renderContent()}
        </CardContent>
      </Card>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-4xl p-0 max-h-[90vh] overflow-hidden">
          {selectedInvoiceId && (
            <InvoiceDetailView 
              invoiceId={selectedInvoiceId} 
              onClose={() => setIsDetailOpen(false)} 
              onActionComplete={handleActionComplete}
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
    </motion.div>
  )
}