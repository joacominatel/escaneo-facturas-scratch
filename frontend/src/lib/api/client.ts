import { ApiErrorResponse } from './types'

// Custom error class for API errors
export class ApiError extends Error {
  status: number
  errorData?: ApiErrorResponse

  constructor(message: string, status: number, errorData?: ApiErrorResponse) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errorData = errorData
    // Set the prototype explicitly to allow instanceof checks
    Object.setPrototypeOf(this, ApiError.prototype)
  }
}

/**
 * Gets the API base URL from environment variables.
 * Falls back to localhost:8010 if not set (useful for some testing scenarios).
 */
function getApiBaseUrl(): string {
  // Ensure this runs correctly on server and client
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8010"
  // Remove trailing slash if present
  return baseUrl.replace(/\/$/, '')
}

/**
 * Centralized API request function.
 * Handles base URL, common headers, JSON parsing, and error handling.
 * @param endpoint The API endpoint path (e.g., '/api/invoices')
 * @param options Standard Fetch API options (method, headers, body, etc.)
 * @returns Promise resolving to the parsed JSON data
 * @throws {ApiError} If the API response is not ok (status >= 400)
 */
export async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${getApiBaseUrl()}${endpoint}`
  
  // Base headers, treat as a record for easier manipulation
  const baseHeaders: Record<string, string> = {
    'Accept': 'application/json',
    // Spread options.headers carefully, as it might be Headers or string[][]
    ...(options.headers instanceof Headers
      ? Object.fromEntries(options.headers.entries())
      : Array.isArray(options.headers)
      ? Object.fromEntries(options.headers)
      : options.headers || {}),
  }

  // If body is an object, stringify it (unless it's FormData)
  let body = options.body
  if (body && typeof body === 'object' && !(body instanceof FormData)) {
    body = JSON.stringify(body)
    // Add Content-Type for JSON body if not already present
    if (!baseHeaders['Content-Type']) {
      baseHeaders['Content-Type'] = 'application/json'
    }
  } 
  // Note: If body is FormData, 'Content-Type' is NOT set here;
  // the browser will set it automatically with the correct boundary.

  try {
    const response = await fetch(url, {
      ...options,
      headers: baseHeaders, // Pass the record object
      body: body,
    })

    if (!response.ok) {
      let errorData: ApiErrorResponse | undefined
      try {
        // Try to parse error details from the response body
        errorData = await response.json()
      } catch (parseError) {
        // If parsing fails, use the status text as the error message
        errorData = { error: response.statusText }
      }
      throw new ApiError(
        `API Error: ${response.status} ${response.statusText}`, 
        response.status, 
        errorData
      )
    }

    // Handle responses with no content (e.g., 204 No Content)
    if (response.status === 204) {
      return null as T // Or handle as needed, maybe return Promise<void>?
    }

    // Parse successful response as JSON
    return await response.json() as T

  } catch (error) {
    console.error(`API Request Failed: ${options.method || 'GET'} ${endpoint}`, error)
    // Re-throw ApiError instances, wrap others
    if (error instanceof ApiError) {
      throw error
    } else if (error instanceof Error) {
      // Wrap generic fetch errors (e.g., network issues)
      throw new ApiError(`Network or fetch error: ${error.message}`, 0) // Status 0 for network errors
    } else {
      // Handle unexpected error types
      throw new ApiError('An unexpected error occurred', 0)
    }
  }
}

// Re-export getApiBaseUrl if needed elsewhere
export { getApiBaseUrl } 