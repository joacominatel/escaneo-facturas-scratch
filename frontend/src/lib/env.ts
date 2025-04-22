// Environment variables helper

export const getEnv = () => {
  return {
    BACKEND_URL: import.meta.env.VITE_BACKEND_URL || ""
  }
}

// Helper to build backend URLs
export const getApiUrl = (endpoint: string): string => {
  const { BACKEND_URL } = getEnv()
  // Ensure endpoint starts with a slash if the backend URL doesn't end with one
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  return `${BACKEND_URL}${normalizedEndpoint}`
}