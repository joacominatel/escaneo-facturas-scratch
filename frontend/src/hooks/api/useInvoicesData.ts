"use client"

import { useState, useEffect } from "react"
import { getApiUrl } from "@/lib/env"

interface InvoiceItem {
  description: string
  amount: number
  advertising_numbers: string[]
}

interface InvoiceData {
  invoice_id: number
  invoice_number: string
  amount_total: number
  date: string
  bill_to: string
  currency: string
  payment_terms: string
  advertising_numbers: string[]
  items: InvoiceItem[]
}

interface InvoicesDataResponse {
  page: number
  per_page: number
  total: number
  pages: number
  invoices: InvoiceData[]
}

interface InvoicesDataParams {
  page?: number
  per_page?: number
  op_number?: string
}

export function useInvoicesData(initialParams: InvoicesDataParams = {}) {
  const [invoicesData, setInvoicesData] = useState<InvoiceData[]>([])
  const [pagination, setPagination] = useState({
    page: initialParams.page || 1,
    per_page: initialParams.per_page || 10,
    total: 0,
    pages: 0,
  })
  const [params, setParams] = useState<InvoicesDataParams>(initialParams)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchInvoicesData = async (newParams?: InvoicesDataParams) => {
    const queryParams = newParams || params
    setIsLoading(true)
    setError(null)

    try {
      // Construir query string
      const queryString = new URLSearchParams()
      if (queryParams.page) queryString.append("page", queryParams.page.toString())
      if (queryParams.per_page) queryString.append("per_page", queryParams.per_page.toString())
      if (queryParams.op_number) queryString.append("op_number", queryParams.op_number)

      const response = await fetch(getApiUrl(`api/invoices/data?${queryString.toString()}`))

      if (!response.ok) {
        throw new Error(`Error al obtener datos de facturas: ${response.statusText}`)
      }

      const data: InvoicesDataResponse = await response.json()
      setInvoicesData(data.invoices)
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
      console.error("Error al obtener datos de facturas:", error)
      setError(error instanceof Error ? error.message : "Error desconocido")
      return null
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchInvoicesData()
  }, [])

  const updateParams = (newParams: InvoicesDataParams) => {
    const updatedParams = { ...params, ...newParams }
    fetchInvoicesData(updatedParams)
  }

  return {
    invoicesData,
    pagination,
    isLoading,
    error,
    updateParams,
    refreshInvoicesData: () => fetchInvoicesData(),
  }
}
