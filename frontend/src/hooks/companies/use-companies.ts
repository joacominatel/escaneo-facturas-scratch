import { useState, useEffect, useCallback } from 'react'
import { listCompanies, Company } from '@/lib/api' // Importar desde el índice

export interface UseCompaniesResult {
  companies: Company[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useCompanies(): UseCompaniesResult {
  const [companies, setCompanies] = useState<Company[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchCompanies = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await listCompanies()
      setCompanies(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch companies'))
      setCompanies([]) // Limpiar en caso de error
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCompanies()
  }, [fetchCompanies])

  return { companies, isLoading, error, refetch: fetchCompanies }
} 