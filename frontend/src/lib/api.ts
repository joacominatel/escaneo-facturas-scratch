// This file contains API functions to interact with the backend

/**
 * Helper function to get the API base URL
 * Uses the same hostname but port 8010
 */
function getApiBaseUrl(): string {
  // Get the current hostname (works in browser environments)
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  return `http://${hostname}:8010`;
}

/**
 * Fetches the summary of invoice statuses
 * @returns Promise with status counts
 */
export async function fetchInvoiceStatusSummary(): Promise<Record<string, number>> {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/invoices/status-summary/`)
  
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }
  
      return await response.json()
    } catch (error) {
      console.error("Error fetching invoice status summary:", error)
      throw error
    }
  }
  
  /**
   * Fetches data for invoice charts
   * @returns Promise with chart data
   */
  export async function fetchInvoiceChartData(): Promise<any[]> {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/invoices/chart-data`)
  
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }
  
      return await response.json()
    } catch (error) {
      console.error("Error fetching invoice chart data:", error)
      throw error
    }
  }
  
  /**
   * Fetches recent invoices
   * @param limit Number of invoices to fetch
   * @returns Promise with invoice data
   */
  export async function fetchRecentInvoices(limit = 5): Promise<any[]> {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/invoices?per_page=${limit}`)
  
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }
  
      const data = await response.json()
      return data.items || []
    } catch (error) {
      console.error("Error fetching recent invoices:", error)
      throw error
    }
  }
  
  /**
   * Retries processing a failed invoice
   * @param invoiceId ID of the invoice to retry
   * @returns Promise with result
   */
  export async function retryInvoiceProcessing(invoiceId: number): Promise<any> {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/invoices/${invoiceId}/retry`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })
  
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }
  
      return await response.json()
    } catch (error) {
      console.error(`Error retrying invoice ${invoiceId}:`, error)
      throw error
    }
  }
  
  /**
   * Downloads an invoice file
   * @param invoiceId ID of the invoice to download
   * @returns Promise with blob data
   */
  export async function downloadInvoice(invoiceId: number): Promise<Blob> {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/invoices/${invoiceId}/download`)
  
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }
  
      return await response.blob()
    } catch (error) {
      console.error(`Error downloading invoice ${invoiceId}:`, error)
      throw error
    }
  }
