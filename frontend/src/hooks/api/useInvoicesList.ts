"use client"

import { useState, useEffect } from "react"
import { getApiUrl } from "@/lib/env"

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

    const fetchInvoices = async (newParams?: InvoicesListParams) => {
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

            const response = await fetch(getApiUrl(`api/invoices/?${queryString.toString()}`))

            if (!response.ok) {
                throw new Error(`Error al obtener facturas: ${response.statusText}`)
            }

            try {
                const data: InvoicesListResponse = await response.json()
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
                console.error("Error al analizar la respuesta JSON:", error)
                setError("Error al analizar la respuesta del servidor")
                return null
            }
        } catch (error) {
            console.error("Error al obtener facturas:", error)
            setError(error instanceof Error ? error.message : "Error desconocido")
            return null
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchInvoices()
    }, [])

    const updateParams = (newParams: InvoicesListParams) => {
        const updatedParams = { ...params, ...newParams }
        fetchInvoices(updatedParams)
    }

    return {
        invoices,
        pagination,
        isLoading,
        error,
        updateParams,
        refreshInvoices: () => fetchInvoices(),
    }
}
