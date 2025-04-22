/**
 * Safely parses JSON from an API response
 * @param response The fetch Response object
 * @returns Parsed JSON data
 * @throws Error with descriptive message if parsing fails
 */
export async function safeJsonParse<T>(response: Response): Promise<T> {
    try {
      return await response.json() as T;
    } catch (error) {
      // Check if it's a JSON parsing error
      const isParseError = error instanceof SyntaxError && 
        error.message.includes('JSON');
      
      if (isParseError) {
        console.error('JSON parsing error:', error);
        throw new Error(
          `Failed to parse API response as JSON. The server might have returned invalid data or an HTML error page.`
        );
      }
      
      // Re-throw other errors
      throw error;
    }
  }
  
  /**
   * Handles API errors consistently
   * @param error The caught error
   * @param fallbackMessage Default message if error is not an Error instance
   * @returns Formatted error message
   */
  export function handleApiError(error: unknown, fallbackMessage = "An unknown error occurred"): string {
    console.error('API error:', error);
    
    if (error instanceof Error) {
      return error.message;
    }
    
    return fallbackMessage;
  }
  
  /**
   * Checks if the response is OK and handles common HTTP errors
   * @param response The fetch Response object
   * @throws Error with appropriate message based on status code
   */
  export function checkResponseStatus(response: Response): void {
    if (!response.ok) {
      // Handle common HTTP status codes
      switch (response.status) {
        case 400:
          throw new Error('Bad request: The server could not understand the request');
        case 401:
          throw new Error('Unauthorized: Authentication is required');
        case 403:
          throw new Error('Forbidden: You do not have permission to access this resource');
        case 404:
          throw new Error('Not found: The requested resource could not be found');
        case 500:
          throw new Error('Server error: The server encountered an unexpected condition');
        case 503:
          throw new Error('Service unavailable: The server is temporarily unable to handle the request');
        default:
          throw new Error(`Request failed with status: ${response.status}`);
      }
    }
  }
  