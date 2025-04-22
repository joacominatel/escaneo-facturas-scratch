"use client"

import { useState, useEffect, useCallback } from "react"
import { getApiUrl } from "@/lib/env"
import { safeJsonParse, handleApiError, checkResponseStatus } from "@/lib/api-utils"

interface StatusSummary {
  waiting_validation: number
  processing: number
  processed: number
  failed: number
  rejected: number
}

interface StatusSummaryResponse {
  summary: StatusSummary
}

export function useInvoicesSummary() {
  const [summary, setSummary] = useState<StatusSummary | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSummary = useCallback(async () => {
    setIsLoading(true)
    console.log(getApiUrl("api/invoices/status-summary/"))
    setError(null)

    try {
      const response = await fetch(getApiUrl("api/invoices/status-summary/"))
      
      // Check if response is OK
      checkResponseStatus(response)

      // Safely parse JSON
      const data = await safeJsonParse<StatusSummaryResponse>(response)
      
      setSummary(data.summary)
      return data.summary
    } catch (error) {
      const errorMessage = handleApiError(error, "Failed to fetch status summary")
      setError(errorMessage)
      
      // Return default summary to prevent UI errors
      return {
        waiting_validation: 0,
        processing: 0,
        processed: 0,
        failed: 0,
        rejected: 0
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSummary()
  }, [fetchSummary])

  return {
    summary,
    isLoading,
    error,
    refreshSummary: fetchSummary,
  }
}
