"use client"

import { useState, useCallback } from "react"
import { getApiUrl } from "@/lib/env"
import { safeJsonParse, handleApiError, checkResponseStatus } from "@/lib/api-utils"

interface InvoiceItem {
  description: string
  amount: number
  advertising_numbers?: string[]
  quantity?: number | null
  unit_price?: number | null
}

interface InvoiceDetails {
  final_data: {
    invoice_number: string
    amount_total: number
    date: string
    bill_to: string
    currency: string
    payment_terms: string
    operation_codes: string[]
    items: InvoiceItem[]
  }
  invoice_id: number
  status: string
}

export function useInvoiceDetails() {
  const [details, setDetails] = useState<InvoiceDetails | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchInvoiceDetails = useCallback(async (invoiceId: number) => {
    if (!invoiceId) return null

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(getApiUrl(`api/invoices/${invoiceId}`))

      // Check if response is OK
      checkResponseStatus(response)

      // Safely parse JSON
      const data = await safeJsonParse<InvoiceDetails>(response)

      setDetails(data)
      return data
    } catch (error) {
      const errorMessage = handleApiError(error, "Error al obtener detalles de la factura")
      setError(errorMessage)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    details,
    isLoading,
    error,
    fetchInvoiceDetails,
  }
}
