"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { InvoiceHistoryFilters as InvoiceHistoryFiltersComponent } from "@/components/history/invoice-history-filters"
import { InvoiceHistoryTable } from "@/components/history/invoice-history-table"
import { InvoicePagination } from "@/components/history/invoice-pagination"
import { fetchInvoiceHistory } from "@/lib/api"
import { toast } from "sonner"
import { useSearchParams, useRouter, usePathname } from "next/navigation"

export type InvoiceHistoryFilters = {
  status?: string
  search?: string
  dateFrom?: string
  dateTo?: string
  sortBy?: string
  sortOrder?: "asc" | "desc"
}

export default function HistoryPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  
  const [invoices, setInvoices] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  // Get current page and per_page from URL params or use defaults
  const page = Number(searchParams.get("page") || "1")
  const perPage = Number(searchParams.get("per_page") || "10")
  
  // Get filter values from URL params
  const filters: InvoiceHistoryFilters = {
    status: searchParams.get("status") || undefined,
    search: searchParams.get("search") || undefined,
    dateFrom: searchParams.get("date_from") || undefined,
    dateTo: searchParams.get("date_to") || undefined,
    sortBy: searchParams.get("sort_by") || "created_at",
    sortOrder: (searchParams.get("sort_order") as "asc" | "desc") || "desc",
  }

  // Function to update URL with new filters or pagination
  const updateUrlParams = (params: Record<string, string | number | undefined>) => {
    const newParams = new URLSearchParams(searchParams.toString())
    
    // Update or remove params based on values
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === "") {
        newParams.delete(key)
      } else {
        newParams.set(key, String(value))
      }
    })
    
    router.push(`${pathname}?${newParams.toString()}`)
  }

  // Handle filter changes
  const handleFilterChange = (newFilters: InvoiceHistoryFilters) => {
    // Reset to page 1 when filters change
    updateUrlParams({
      ...newFilters,
      page: 1
    })
  }

  // Handle pagination changes
  const handlePageChange = (newPage: number) => {
    updateUrlParams({ page: newPage })
  }

  // Handle per page changes
  const handlePerPageChange = (newPerPage: number) => {
    updateUrlParams({ 
      per_page: newPerPage,
      page: 1 // Reset to page 1 when changing items per page
    })
  }

  // Fetch invoice data when params change
  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const result = await fetchInvoiceHistory({
          page,
          perPage,
          status: filters.status,
          search: filters.search,
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder
        })
        
        setInvoices(result.invoices)
        setTotalItems(result.total)
        setTotalPages(result.total_pages)
      } catch (err) {
        console.error("Failed to fetch invoice history:", err)
        setError("Failed to load invoice history. Please try again later.")
        toast.error("Failed to load invoice history")
      } finally {
        setIsLoading(false)
      }
    }

    fetchInvoices()
  }, [page, perPage, filters.status, filters.search, filters.dateFrom, filters.dateTo, filters.sortBy, filters.sortOrder])

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Invoice History"
        text="View and manage all your invoice processing activities"
      />
      
      <InvoiceHistoryFiltersComponent
        filters={filters} 
        onFilterChange={handleFilterChange} 
      />
      
      <InvoiceHistoryTable 
        invoices={invoices}
        isLoading={isLoading}
        error={error}
        sortBy={filters.sortBy}
        sortOrder={filters.sortOrder}
        onSortChange={(sortBy, sortOrder) => handleFilterChange({ ...filters, sortBy, sortOrder })}
      />
      
      {!isLoading && !error && totalPages > 0 && (
        <InvoicePagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalItems}
          perPage={perPage}
          onPageChange={handlePageChange}
          onPerPageChange={handlePerPageChange}
        />
      )}
    </DashboardShell>
  )
}
