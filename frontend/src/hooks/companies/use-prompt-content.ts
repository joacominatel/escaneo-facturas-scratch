import { useState, useEffect, useCallback } from 'react'
import { getPromptContent } from '@/lib/api'

export interface UsePromptContentResult {
  content: string | null;
  isLoading: boolean;
  error: Error | null;
  fetchContent: () => void; // Permitir fetch manual
}

export function usePromptContent(companyId: number | null, promptId: number | null): UsePromptContentResult {
  const [content, setContent] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchContentCallback = useCallback(async () => {
    if (promptId === null || companyId === null) {
      setContent(null)
      setIsLoading(false)
      setError(null)
      return // No hacer nada si no hay ID
    }

    setIsLoading(true)
    setError(null)
    setContent(null) // Limpiar contenido anterior
    try {
      // ASUNCIÓN: getPromptContent existe y funciona
      const data = await getPromptContent(companyId, promptId)
      setContent(data)
    } catch (err) {
      console.error(`Failed to fetch content for prompt ${promptId}:`, err)
      setError(err instanceof Error ? err : new Error('Failed to fetch prompt content'))
      setContent(null)
    } finally {
      setIsLoading(false)
    }
  }, [promptId])

  // No hacemos fetch automático al montar, el usuario debe dispararlo
  // mediante fetchContent

  return { content, isLoading, error, fetchContent: fetchContentCallback }
} 