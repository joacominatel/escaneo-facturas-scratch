import { apiRequest, ApiError, getApiBaseUrl } from './client'
import {
  InvoiceStatusSummary,
  InvoiceDetail,
  PaginatedInvoices,
  InvoiceListItem,
  ProcessedInvoiceData,
  SimpleSuccessResponse,
  FetchInvoiceHistoryOptions,
  InvoiceTrendsResponse,
  FetchInvoiceTrendsOptions,
} from './types'

export interface InvoiceStatusSummaryOptions {
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
}

/**
 * Fetches the summary of invoice statuses
 * @param options Optional start and end dates for filtering
 * @returns Promise with status counts
 */
export async function fetchInvoiceStatusSummary(options?: InvoiceStatusSummaryOptions): Promise<InvoiceStatusSummary> {
  try {
    let url = '/api/invoices/status-summary/';
    if (options && (options.startDate || options.endDate)) {
      const params = new URLSearchParams();
      if (options.startDate) {
        params.append('start_date', options.startDate);
      }
      if (options.endDate) {
        params.append('end_date', options.endDate);
      }
      url += `?${params.toString()}`;
    }
    // The endpoint returns { summary: { ... } }
    return await apiRequest<InvoiceStatusSummary>(url);
  } catch (error) {
    console.error("Error fetching invoice status summary:", error)
    // Provide a default/empty summary on error to avoid crashing components
    if (error instanceof ApiError && error.status === 404) {
      // Handle 404 specifically if needed, maybe API endpoint doesn't exist?
      console.warn("Invoice status summary endpoint not found (404).")
    }
    // You might want to return a specific structure or re-throw depending on component needs
    return { summary: {} }
  }
}

/**
 * Fetches data for invoice charts - **NOTE: Returns status summary, NOT historical data.**
 * The previous implementation generated fake monthly data.
 * This now correctly returns the data from the `/api/invoices/status-summary/` endpoint.
 * If historical chart data is needed, a different API endpoint is required.
 * @param options Optional start and end dates for filtering
 * @returns Promise with status summary data
 */
export async function fetchInvoiceChartData(options?: InvoiceStatusSummaryOptions): Promise<InvoiceStatusSummary> {
  // Re-uses the status summary endpoint as per the original code's target URL
  // Consider renaming this function if it's only used for the summary
  return fetchInvoiceStatusSummary(options);
}

/**
 * Fetches recent invoices (uses the main invoice list endpoint)
 * @param limit Number of invoices to fetch (default 5)
 * @returns Promise with invoice list items
 */
export async function fetchRecentInvoices(limit = 5): Promise<InvoiceListItem[]> {
  try {
    const result = await fetchInvoiceHistory({ page: 1, perPage: limit, sortBy: 'created_at', sortOrder: 'desc' })
    return result.invoices
  } catch (error) {
    console.error("Error fetching recent invoices:", error)
    return [] // Return empty array on error
  }
}

/**
 * Fetches details for a specific invoice
 * @param invoiceId ID of the invoice to fetch
 * @returns Promise with invoice details
 */
export async function fetchInvoiceDetails(invoiceId: number): Promise<InvoiceDetail | null> {
  try {
    return await apiRequest<InvoiceDetail>(`/api/invoices/${invoiceId}`)
  } catch (error) {
    console.error(`Error fetching invoice ${invoiceId} details:`, error)
    if (error instanceof ApiError && error.status === 404) {
      console.warn(`Invoice ${invoiceId} not found.`)
      return null // Return null if not found
    }
    throw error // Re-throw other errors
  }
}

/**
 * Fetches processed invoice data with detailed information (from `/api/invoices/data`).
 * Use `fetchInvoiceHistory` to get a list of all invoices regardless of status.
 * @param page Page number (default 1)
 * @param perPage Items per page (default 10)
 * @returns Promise with paginated processed invoice data
 */
export async function fetchInvoiceData(
  page = 1, 
  perPage = 10, 
): Promise<PaginatedInvoices<ProcessedInvoiceData>> {
  try {
    const params = new URLSearchParams()
    params.append("page", String(page))
    params.append("per_page", String(perPage))
    
    // According to docs, this endpoint returns data for *processed* invoices
    // The structure matches PaginatedInvoices<ProcessedInvoiceData>
    const result = await apiRequest<PaginatedInvoices<ProcessedInvoiceData>>(
      `/api/invoices/data?${params.toString()}`
    )
    return result

  } catch (error) {
    console.error("Error fetching processed invoice data:", error)
    // Return an empty pagination structure on error
    return { page, per_page: perPage, total: 0, pages: 0, invoices: [] }
  }
}

/**
 * Retries processing a failed or rejected invoice
 * @param invoiceId ID of the invoice to retry
 * @returns Promise with result message and status
 */
export async function retryInvoiceProcessing(invoiceId: number): Promise<SimpleSuccessResponse> {
  return apiRequest<SimpleSuccessResponse>(`/api/invoices/${invoiceId}/retry`, {
    method: "POST",
  })
}

/**
 * Confirms an invoice that is waiting for validation
 * @param invoiceId ID of the invoice to confirm
 * @returns Promise with result message and status
 */
export async function confirmInvoice(invoiceId: number): Promise<SimpleSuccessResponse> {
  return apiRequest<SimpleSuccessResponse>(`/api/invoices/${invoiceId}/confirm`, {
    method: "POST",
  })
}

/**
 * Rejects an invoice
 * @param invoiceId ID of the invoice to reject
 * @param reason Optional reason for rejection
 * @returns Promise with result message and status
 */
export async function rejectInvoice(invoiceId: number, reason?: string): Promise<SimpleSuccessResponse> {
  return apiRequest<SimpleSuccessResponse>(`/api/invoices/${invoiceId}/reject`, {
    method: "POST",
    body: reason ? JSON.stringify({ reason }) : undefined,
  })
}

/**
 * Downloads an invoice file
 * @param invoiceId ID of the invoice to download
 * @returns Promise resolving to the file Blob
 */
export async function downloadInvoice(invoiceId: number): Promise<Blob> {
  const url = `${getApiBaseUrl()}/api/invoices/${invoiceId}/download` // Construct URL manually for blob response
  try {
    const response = await fetch(url)

    if (!response.ok) {
      let errorDetails = response.statusText
      if (response.headers.get('content-type')?.includes('application/json')) {
         try {
           const errJson = await response.json()
           errorDetails = errJson.error || errorDetails
         } catch {}
      }
      throw new ApiError(
        `Download failed: ${response.status} ${errorDetails}`,
        response.status,
        { error: errorDetails }
      )
    }

    return await response.blob()
  } catch (error) {
    console.error(`Error downloading invoice ${invoiceId}:`, error)
    if (error instanceof ApiError) {
      throw error
    }
    throw new ApiError(`Network or fetch error during download: ${(error as Error).message}`, 0)
  }
}

/**
 * Fetches invoice history (list of all invoices) with filtering and pagination
 * @param options Filter and pagination options
 * @returns Promise with paginated invoice list items
 */
export async function fetchInvoiceHistory(
  options: FetchInvoiceHistoryOptions = {}
): Promise<PaginatedInvoices<InvoiceListItem>> {
  const { 
    page = 1, 
    perPage = 10, 
    status, 
    search, 
    sortBy = "created_at", 
    sortOrder = "desc" 
  } = options

  try {
    const params = new URLSearchParams()
    params.append("page", String(page))
    params.append("per_page", String(perPage))

    // Handle single or multiple statuses
    if (status) {
      if (Array.isArray(status)) {
        status.forEach(s => params.append("status", s))
      } else {
        params.append("status", status)
      }
    }
    if (search) params.append("search", search)
    // Add date filters here if needed based on `options`
    // if (options.dateFrom) params.append("date_from", options.dateFrom)
    // if (options.dateTo) params.append("date_to", options.dateTo)
    if (sortBy) params.append("sort_by", sortBy)
    if (sortOrder) params.append("sort_order", sortOrder)

    // Type according to API docs for GET /api/invoices/
    const result = await apiRequest<PaginatedInvoices<InvoiceListItem>>(
      `/api/invoices/?${params.toString()}`
    )

    // Check consistency between API response field ('pages') and expected type ('pages')
    // If the API actually returns 'total_pages', adjust the type 'PaginatedInvoices'
    // or transform the response here.
    // Assuming the type 'PaginatedInvoices' with 'pages' is correct as defined.
    return result

  } catch (error) {
    console.error("Error fetching invoice history:", error)
    // Return an empty pagination structure on error
    return { page, per_page: perPage, total: 0, pages: 0, invoices: [] }
  }
}

/**
 * Fetches invoice trend data (e.g., count of processed invoices per day).
 * @param options Options for fetching trend data (days_ago, start_date, end_date, status)
 * @returns Promise with trend data
 */
export async function fetchInvoiceTrends(
  options?: FetchInvoiceTrendsOptions
): Promise<InvoiceTrendsResponse> {
  try {
    let url = '/api/invoices/trends/';
    if (options) {
      const params = new URLSearchParams();
      if (options.days_ago) {
        params.append('days_ago', String(options.days_ago));
      }
      if (options.start_date) {
        params.append('start_date', options.start_date);
      }
      if (options.end_date) {
        params.append('end_date', options.end_date);
      }
      if (options.status) {
        params.append('status', options.status);
      }
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
    }
    return await apiRequest<InvoiceTrendsResponse>(url);
  } catch (error) {
    console.error("Error fetching invoice trends:", error);
    // Devolver una estructura vacía o por defecto en caso de error
    return {
      trend_data: [],
      status_queried: options?.status || 'unknown',
      start_date: '',
      end_date: '',
    };
  }
}

// TODO: Add function for uploading invoices (POST /api/invoices/ocr)
// This requires handling FormData which is slightly different
// export async function uploadInvoices(files: FileList): Promise<UploadResponseItem[]> {
//   const formData = new FormData()
//   for (let i = 0; i < files.length; i++) {
//     formData.append('file', files[i])
//   }
// 
//   return apiRequest<UploadResponseItem[]>('/api/invoices/ocr', {
//     method: 'POST',
//     body: formData,
//     // Content-Type is set automatically by the browser for FormData
//   })
// } 