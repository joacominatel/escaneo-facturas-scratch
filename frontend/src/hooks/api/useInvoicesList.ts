"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { getApiUrl } from "@/lib/env"
import { safeJsonParse, handleApiError, checkResponseStatus } from "@/lib/api-utils"

interface Invoice {
  id: number
  filename: string
  status: string
  created_at: string
}

interface InvoicesListResponse {
  page: number
  per_page: number
  total: number
  pages: number
  invoices: Invoice[]
}

// Actualizar la interfaz InvoicesListParams para usar search en lugar de op_number
interface InvoicesListParams {
  page?: number
  per_page?: number
  status?: string
  search?: string // Cambiado de op_number a search para coincidir con la API
  date?: string
  sort_by?: string
  sort_order?: string
}

// Tipo para la caché
interface CacheEntry {
  data: InvoicesListResponse
  timestamp: number
}

// Tiempo de expiración de la caché en milisegundos (5 minutos)
const CACHE_EXPIRATION = 5 * 60 * 1000

export function useInvoicesList(initialParams: InvoicesListParams = {}) {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [pagination, setPagination] = useState({
    page: initialParams.page || 1,
    per_page: initialParams.per_page || 10,
    total: 0,
    pages: 0,
  })
  const [params, setParams] = useState<InvoicesListParams>(initialParams)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Referencia para la caché
  const cacheRef = useRef<Record<string, CacheEntry>>({})

  // Función para generar la clave de caché
  const getCacheKey = (queryParams: InvoicesListParams): string => {
    return JSON.stringify(queryParams)
  }

  // Función para verificar si la caché es válida
  const isCacheValid = (entry: CacheEntry): boolean => {
    return Date.now() - entry.timestamp < CACHE_EXPIRATION
  }

  const fetchInvoices = useCallback(
    async (newParams?: InvoicesListParams) => {
      const queryParams = newParams || params

      // Generar clave de caché
      const cacheKey = getCacheKey(queryParams)

      // Verificar si hay datos en caché y si son válidos
      const cachedData = cacheRef.current[cacheKey]
      if (cachedData && isCacheValid(cachedData)) {
        setInvoices(cachedData.data.invoices)
        setPagination({
          page: cachedData.data.page,
          per_page: cachedData.data.per_page,
          total: cachedData.data.total,
          pages: cachedData.data.pages,
        })

        if (newParams) {
          setParams(newParams)
        }

        return cachedData.data
      }

      setIsLoading(true)
      setError(null)

      try {
        // En la función fetchInvoices, actualizar la construcción del queryString
        // Buscar esta sección y reemplazarla:
        // Construir query string
        const queryString = new URLSearchParams()
        if (queryParams.page) queryString.append("page", queryParams.page.toString())
        if (queryParams.per_page) queryString.append("per_page", queryParams.per_page.toString())
        if (queryParams.status) queryString.append("status", queryParams.status)
        if (queryParams.search) queryString.append("search", queryParams.search) // Cambiado de op_number a search
        if (queryParams.date) queryString.append("date", queryParams.date)

        const response = await fetch(getApiUrl(`api/invoices/?${queryString.toString()}`))

        // Check if response is OK
        checkResponseStatus(response)

        // Safely parse JSON
        const data = await safeJsonParse<InvoicesListResponse>(response)

        // Guardar en caché
        cacheRef.current[cacheKey] = {
          data,
          timestamp: Date.now(),
        }

        setInvoices(data.invoices)
        setPagination({
          page: data.page,
          per_page: data.per_page,
          total: data.total,
          pages: data.pages,
        })

        if (newParams) {
          setParams(newParams)
        }

        return data
      } catch (error) {
        const errorMessage = handleApiError(error, "Failed to fetch invoices")
        setError(errorMessage)

        // Return empty data structure to prevent UI errors
        return {
          page: queryParams.page || 1,
          per_page: queryParams.per_page || 10,
          total: 0,
          pages: 0,
          invoices: [],
        }
      } finally {
        setIsLoading(false)
      }
    },
    [params],
  )

  // Efecto para cargar los datos iniciales
  useEffect(() => {
    // Solo cargar datos si no hay datos en caché
    const cacheKey = getCacheKey(params)
    const cachedData = cacheRef.current[cacheKey]

    if (!cachedData || !isCacheValid(cachedData)) {
      fetchInvoices()
    }
  }, [fetchInvoices, params])

  // Función para actualizar parámetros con memoización
  const updateParams = useCallback(
    (newParams: InvoicesListParams) => {
      const updatedParams = { ...params, ...newParams }

      // Evitar actualizaciones innecesarias si los parámetros son iguales
      if (JSON.stringify(updatedParams) !== JSON.stringify(params)) {
        setParams(updatedParams)
        fetchInvoices(updatedParams)
      }
    },
    [params, fetchInvoices],
  )

  // Función para limpiar la caché
  const clearCache = useCallback(() => {
    cacheRef.current = {}
  }, [])

  // Función para refrescar los datos con limpieza de caché opcional
  const refreshInvoices = useCallback(
    (clearCacheBeforeRefresh = false) => {
      if (clearCacheBeforeRefresh) {
        clearCache()
      }
      return fetchInvoices()
    },
    [fetchInvoices, clearCache],
  )

  return {
    invoices,
    pagination,
    isLoading,
    error,
    updateParams,
    refreshInvoices,
    clearCache,
  }
}
