import { useState, useEffect, useCallback } from 'react'
import { listCompanyPrompts, CompanyPrompt } from '@/lib/api'

export interface UseCompanyPromptsResult {
  prompts: CompanyPrompt[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useCompanyPrompts(companyId: number | null): UseCompanyPromptsResult {
  const [prompts, setPrompts] = useState<CompanyPrompt[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false) // No cargar inicialmente
  const [error, setError] = useState<Error | null>(null)

  const fetchPrompts = useCallback(async () => {
    if (companyId === null) {
      setPrompts([])
      setIsLoading(false)
      setError(null)
      return // No hacer nada si no hay ID
    }

    setIsLoading(true)
    setError(null)
    try {
      // ASUNCIÓN: listCompanyPrompts existe y funciona
      const data = await listCompanyPrompts(companyId)
      setPrompts(data)
    } catch (err) {
      console.error(`Failed to fetch prompts for company ${companyId}:`, err)
      setError(err instanceof Error ? err : new Error('Failed to fetch company prompts'))
      setPrompts([]) // Limpiar en caso de error
    } finally {
      setIsLoading(false)
    }
  }, [companyId])

  // Fetch inicial o cuando cambie companyId (y no sea null)
  useEffect(() => {
    if (companyId !== null) {
      fetchPrompts()
    }
    // Limpiar si el companyId se vuelve null
    return () => {
        if(companyId === null) {
            setPrompts([]);
            setError(null);
        }
    }
  }, [companyId, fetchPrompts])

  // Permitir refetch manual incluso si companyId es null (puede que se setee después)
  const manualRefetch = useCallback(() => {
      if (companyId !== null) {
          fetchPrompts();
      }
  }, [companyId, fetchPrompts]);

  return { prompts, isLoading, error, refetch: manualRefetch }
} 