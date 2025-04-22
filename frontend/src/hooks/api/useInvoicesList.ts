"use client"

import { useState, useEffect, useCallback } from "react"
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

interface InvoicesListParams {
  page?: number
  per_page?: number
  status?: string
  op_number?: string
  date?: string // Añadimos el filtro de fecha
}

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

  const fetchInvoices = useCallback(
    async (newParams?: InvoicesListParams) => {
      const queryParams = newParams || params
      setIsLoading(true)
      setError(null)

      try {
        // Construir query string
        const queryString = new URLSearchParams()
        if (queryParams.page) queryString.append("page", queryParams.page.toString())
        if (queryParams.per_page) queryString.append("per_page", queryParams.per_page.toString())
        if (queryParams.status) queryString.append("status", queryParams.status)
        if (queryParams.op_number) queryString.append("op_number", queryParams.op_number)
        if (queryParams.date) queryString.append("date", queryParams.date)

        const response = await fetch(getApiUrl(`api/invoices/?${queryString.toString()}`))

        // Check if response is OK
        checkResponseStatus(response)

        // Safely parse JSON
        const data = await safeJsonParse<InvoicesListResponse>(response)

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

  useEffect(() => {
    fetchInvoices()
  }, [fetchInvoices])

  const updateParams = useCallback(
    (newParams: InvoicesListParams) => {
      const updatedParams = { ...params, ...newParams }
      fetchInvoices(updatedParams)
    },
    [params, fetchInvoices],
  )

  return {
    invoices,
    pagination,
    isLoading,
    error,
    updateParams,
    refreshInvoices: () => fetchInvoices(),
  }
}
