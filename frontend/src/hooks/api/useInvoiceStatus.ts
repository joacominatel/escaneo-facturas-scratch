"use client"

import { useState, useEffect, useCallback } from "react"
import { getApiUrl } from "@/lib/env"
import { safeJsonParse, handleApiError, checkResponseStatus } from "@/lib/api-utils"

interface InvoiceStatusResponse {
  invoice_id: number
  status: string
  message: string
  progress: number
  log_events: string[]
}

export function useInvoiceStatus(invoiceId: number | null) {
  const [status, setStatus] = useState<InvoiceStatusResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStatus = useCallback(async () => {
    if (!invoiceId) return null

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(getApiUrl(`api/invoices/${invoiceId}/status`))
      
      // Check if response is OK
      checkResponseStatus(response)

      // Safely parse JSON
      const data = await safeJsonParse<InvoiceStatusResponse>(response)
      
      setStatus(data)
      return data
    } catch (error) {
      const errorMessage = handleApiError(error, "Failed to fetch invoice status")
      setError(errorMessage)
      
      // Return null instead of a default object since this is a specific invoice
      return null
    } finally {
      setIsLoading(false)
    }
  }, [invoiceId])

  useEffect(() => {
    if (invoiceId) {
      fetchStatus()
    }
  }, [invoiceId, fetchStatus])

  return {
    status,
    isLoading,
    error,
    refreshStatus: fetchStatus,
  }
}
