"use client"

import { useState } from "react"
import { toast } from "sonner"
import { getApiUrl } from "@/lib/env"

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

      if (!response.ok) {
        throw new Error(`Error al confirmar factura: ${response.statusText}`)
      }

      const data: InvoiceActionResponse = await response.json()
      toast("" , {
        description: data.message,
      })
      return data
    } catch (error) {
      console.error("Error al confirmar factura:", error)
      toast("" , {
        description: error instanceof Error ? error.message : "Ocurrió un error desconocido",
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

      if (!response.ok) {
        throw new Error(`Error al rechazar factura: ${response.statusText}`)
      }

      const data: InvoiceActionResponse = await response.json()
      toast("" , {
        description: data.message,
      })
      return data
    } catch (error) {
      console.error("Error al rechazar factura:", error)
      toast("Error al rechazar factura", {
        description: error instanceof Error ? error.message : "Ocurrió un error desconocido",
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

      if (!response.ok) {
        throw new Error(`Error al reintentar factura: ${response.statusText}`)
      }

      const data: InvoiceActionResponse = await response.json()
      toast("La factura ha sido reintentada", {
        description: data.message,
      })
      return data
    } catch (error) {
      console.error("Error al reintentar factura:", error)
      toast("Error al reintentar factura", {
        description: error instanceof Error ? error.message : "Ocurrió un error desconocido",
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
