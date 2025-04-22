"use client"

import { useState, useEffect } from "react"
import { getApiUrl } from "@/lib/env"

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

  const fetchSummary = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(getApiUrl("api/invoices/status-summary/"))

      if (!response.ok) {
        throw new Error(`Error al obtener resumen: ${response.statusText}`)
      }

      const data: StatusSummaryResponse = await response.json()
      setSummary(data.summary)
      return data.summary
    } catch (error) {
      console.error("Error al obtener resumen:", error)
      setError(error instanceof Error ? error.message : "Error desconocido")
      return null
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSummary()
  }, [])

  return {
    summary,
    isLoading,
    error,
    refreshSummary: fetchSummary,
  }
}
