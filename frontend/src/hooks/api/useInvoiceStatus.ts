"use client"

import { useState, useEffect } from "react"
import { getApiUrl } from "@/lib/env"

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

  const fetchStatus = async () => {
    if (!invoiceId) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(getApiUrl(`api/invoices/${invoiceId}/status`))

      if (!response.ok) {
        throw new Error(`Error al obtener estado: ${response.statusText}`)
      }

      const data: InvoiceStatusResponse = await response.json()
      setStatus(data)
      return data
    } catch (error) {
      console.error("Error al obtener estado:", error)
      setError(error instanceof Error ? error.message : "Error desconocido")
      return null
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (invoiceId) {
      fetchStatus()
    }
  }, [invoiceId])

  return {
    status,
    isLoading,
    error,
    refreshStatus: fetchStatus,
  }
}
