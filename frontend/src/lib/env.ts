// Environment variables helper

export const getEnv = () => {
  return {
    BACKEND_URL: import.meta.env.VITE_BACKEND_URL || ""
  }
}

// Helper to build backend URLs
export const getApiUrl = (endpoint: string): string => {
  const BACKEND_HOSTNAME = window.location.hostname;
  const BACKEND_PORT = import.meta.env.VITE_BACKEND_PORT_ARG || 8010;
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || `http://${BACKEND_HOSTNAME}:${BACKEND_PORT}`

  // Ensure endpoint starts with a slash if the backend URL doesn't end with one
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  return `${BACKEND_URL}${normalizedEndpoint}`
}