import { useState, useCallback } from 'react';
import { updateCompanyDefaultPrompt, CompanyPrompt } from '@/lib/api';
import { toast } from 'sonner';

interface UseUpdateCompanyPromptResult {
  mutate: (companyId: number, content: string) => Promise<CompanyPrompt>;
  isLoading: boolean;
  error: Error | null;
  data: CompanyPrompt | null;
}

export function useUpdateCompanyPrompt(): UseUpdateCompanyPromptResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<CompanyPrompt | null>(null);

  const mutate = useCallback(async (companyId: number, content: string) => {
    setIsLoading(true);
    setError(null);
    setData(null);
    try {
      const newPrompt = await updateCompanyDefaultPrompt(companyId, content);
      setData(newPrompt);
    //   console.log(`Nueva versión de prompt ${newPrompt.version} creada para compañía ${companyId}`);
      toast.success(`Nueva versión de prompt ${newPrompt.version} creada para compañía ${companyId}`);
      return newPrompt;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error al actualizar el prompt');
      setError(error);
      console.error("Error al actualizar prompt:", error);
      toast.error("Error al actualizar el prompt");
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []); // Dependencias vacías ahora

  return { mutate, isLoading, error, data };
} 