"use client"

import { useState } from "react"
import { toast } from "sonner"
import { getApiUrl } from "@/lib/env"
import { safeJsonParse, handleApiError, checkResponseStatus } from "@/lib/api-utils"

interface InvoiceActionResponse {
  invoice_id: number
  status: string
  message: string
}

export function useInvoiceActions() {
  const [isLoading, setIsLoading] = useState(false)

  const confirmInvoice = async (invoiceId: number) => {
    setIsLoading(true)
    try {
      const response = await fetch(getApiUrl(`api/invoices/${invoiceId}/confirm`), {
        method: "POST",
      })

      // Check if response is OK
      checkResponseStatus(response)

      // Safely parse JSON
      const data = await safeJsonParse<InvoiceActionResponse>(response)
      
      toast("", {
        description: data.message,
      })
      return data
    } catch (error) {
      const errorMessage = handleApiError(error, "Error al confirmar factura")
      
      toast("Error al confirmar factura", {
        description: errorMessage,
      })
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const rejectInvoice = async (invoiceId: number, reason: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(getApiUrl(`api/invoices/${invoiceId}/reject`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason }),
      })

      // Check if response is OK
      checkResponseStatus(response)

      // Safely parse JSON
      const data = await safeJsonParse<InvoiceActionResponse>(response)
      
      toast("", {
        description: data.message,
      })
      return data
    } catch (error) {
      const errorMessage = handleApiError(error, "Error al rechazar factura")
      
      toast("Error al rechazar factura", {
        description: errorMessage,
      })
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const retryInvoice = async (invoiceId: number) => {
    setIsLoading(true)
    try {
      const response = await fetch(getApiUrl(`api/invoices/${invoiceId}/retry`), {
        method: "POST",
      })

      // Check if response is OK
      checkResponseStatus(response)

      // Safely parse JSON
      const data = await safeJsonParse<InvoiceActionResponse>(response)
      
      toast("La factura ha sido reintentada", {
        description: data.message,
      })
      return data
    } catch (error) {
      const errorMessage = handleApiError(error, "Error al reintentar factura")
      
      toast("Error al reintentar factura", {
        description: errorMessage,
      })
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return {
    confirmInvoice,
    rejectInvoice,
    retryInvoice,
    isLoading,
  }
}
