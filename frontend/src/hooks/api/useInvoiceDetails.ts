"use client"

import { useState, useCallback, useRef } from "react"
import { getApiUrl } from "@/lib/env"
import { safeJsonParse, handleApiError, checkResponseStatus } from "@/lib/api-utils"

interface InvoiceItem {
  description: string
  amount: number
  advertising_numbers?: string[]
  quantity?: number | null
  unit_price?: number | null
}

interface InvoiceData {
  invoice_number: string
  amount_total: number
  date: string
  bill_to: string
  currency: string
  payment_terms: string
  operation_codes?: string[]
  items: InvoiceItem[]
}

interface InvoiceDetails {
  final_data: InvoiceData | null
  preview: InvoiceData | null
  invoice_id: number
  status: string
}

// Tipo para la caché
interface CacheEntry {
  data: InvoiceDetails
  timestamp: number
}

// Tiempo de expiración de la caché en milisegundos (5 minutos)
const CACHE_EXPIRATION = 5 * 60 * 1000

// Caché global para compartir entre instancias del hook
const detailsCache: Record<number, CacheEntry> = {}

export function useInvoiceDetails() {
  const [details, setDetails] = useState<InvoiceDetails | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Función para verificar si la caché es válida
  const isCacheValid = (entry: CacheEntry): boolean => {
    return Date.now() - entry.timestamp < CACHE_EXPIRATION
  }

  const fetchInvoiceDetails = useCallback(async (invoiceId: number) => {
    if (!invoiceId) return null

    // Cancelar solicitud anterior si existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Crear nuevo AbortController para esta solicitud
    abortControllerRef.current = new AbortController()

    // Verificar si hay datos en caché y si son válidos
    const cachedData = detailsCache[invoiceId]
    if (cachedData && isCacheValid(cachedData)) {
      setDetails(cachedData.data)
      return cachedData.data
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(getApiUrl(`api/invoices/${invoiceId}`), {
        signal: abortControllerRef.current.signal,
      })

      // Check if response is OK
      checkResponseStatus(response)

      // Safely parse JSON
      const data = await safeJsonParse<InvoiceDetails>(response)

      // Guardar en caché
      detailsCache[invoiceId] = {
        data,
        timestamp: Date.now(),
      }

      setDetails(data)
      return data
    } catch (error) {
      // Ignorar errores de abort
      if ((error as Error).name === "AbortError") {
        return null
      }

      const errorMessage = handleApiError(error, "Error al obtener detalles de la factura")
      setError(errorMessage)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Función para limpiar la caché
  const clearCache = useCallback((invoiceId?: number) => {
    if (invoiceId) {
      delete detailsCache[invoiceId]
    } else {
      Object.keys(detailsCache).forEach((key) => {
        delete detailsCache[Number(key)]
      })
    }
  }, [])

  return {
    details,
    isLoading,
    error,
    fetchInvoiceDetails,
    clearCache,
  }
}
