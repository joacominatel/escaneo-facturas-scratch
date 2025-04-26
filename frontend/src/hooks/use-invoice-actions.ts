"use client"

import { useState } from "react"
import { getApiBaseUrl } from "@/lib/api"
import { toast } from "sonner"

export interface InvoiceActionResponse {
  invoice_id: number
  status: string
  message: string
}

export function useInvoiceActions() {
  const [isConfirming, setIsConfirming] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const [isRetrying, setIsRetrying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Confirms an invoice for processing
   */
  const confirmInvoice = async (invoiceId: number): Promise<InvoiceActionResponse | null> => {
    setIsConfirming(true)
    setError(null)

    try {
      const response = await fetch(`${getApiBaseUrl()}/api/invoices/${invoiceId}/confirm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Failed to confirm invoice: ${response.status}`)
      }

      const data = await response.json()
      toast.success("Invoice confirmed", {
        description: data.message || "The invoice has been confirmed and is being processed.",
      })
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred"
      setError(errorMessage)
      toast.error("Failed to confirm invoice", {
        description: errorMessage,
      })
      return null
    } finally {
      setIsConfirming(false)
    }
  }

  /**
   * Rejects an invoice with an optional reason
   */
  const rejectInvoice = async (invoiceId: number, reason?: string): Promise<InvoiceActionResponse | null> => {
    setIsRejecting(true)
    setError(null)

    try {
      const response = await fetch(`${getApiBaseUrl()}/api/invoices/${invoiceId}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Failed to reject invoice: ${response.status}`)
      }

      const data = await response.json()
      toast.success("Invoice rejected", {
        description: data.message || "The invoice has been rejected.",
      })
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred"
      setError(errorMessage)
      toast.error("Failed to reject invoice", {
        description: errorMessage,
      })
      return null
    } finally {
      setIsRejecting(false)
    }
  }

  /**
   * Retries processing for a failed or rejected invoice
   */
  const retryInvoice = async (invoiceId: number): Promise<InvoiceActionResponse | null> => {
    setIsRetrying(true)
    setError(null)

    try {
      const response = await fetch(`${getApiBaseUrl()}/api/invoices/${invoiceId}/retry`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Failed to retry invoice: ${response.status}`)
      }

      const data = await response.json()
      toast.success("Invoice retry initiated", {
        description: data.message || "The invoice has been sent for reprocessing.",
      })
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred"
      setError(errorMessage)
      toast.error("Failed to retry invoice", {
        description: errorMessage,
      })
      return null
    } finally {
      setIsRetrying(false)
    }
  }

  return {
    confirmInvoice,
    rejectInvoice,
    retryInvoice,
    isConfirming,
    isRejecting,
    isRetrying,
    error,
  }
}
