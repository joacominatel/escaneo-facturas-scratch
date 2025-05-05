import { useState, useCallback } from 'react';
import { setPromptAsDefault } from '@/lib/api';
import { toast } from 'sonner';

interface UseSetPromptDefaultResult {
  mutate: (companyId: number, promptId: number) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
}

export function useSetPromptDefault(): UseSetPromptDefaultResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(async (companyId: number, promptId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      await setPromptAsDefault(companyId, promptId);
      console.log(`Prompt ${promptId} marcado como por defecto.`); // Logging en consola
      toast.success(`Prompt ${promptId} marcado como por defecto.`);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error al marcar el prompt como por defecto');
      setError(error);
      console.error("Error al marcar prompt como default:", error); // Logging en consola
      toast.error("Error al marcar el prompt como por defecto");
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []); // Dependencias vacías ahora

  return { mutate, isLoading, error };
} 