import { useState, useCallback } from 'react';
import { createCompany, Company } from '@/lib/api';
import { toast } from 'sonner'; 

interface UseCreateCompanyResult {
  mutate: (name: string) => Promise<Company | null>;
  isLoading: boolean;
  error: Error | null;
  data: Company | null;
}

export function useCreateCompany(): UseCreateCompanyResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<Company | null>(null);

  const mutate = useCallback(async (name: string) => {
    if (!name || !name.trim()) {
        const validationError = new Error("El nombre de la compañía no puede estar vacío.");
        setError(validationError);
        toast.error(validationError.message);
        return null; // Devolver null para indicar fallo de validación
    }

    setIsLoading(true);
    setError(null);
    setData(null);
    try {
      const newCompany = await createCompany(name.trim());
      setData(newCompany);
      toast.success(`Compañía "${newCompany.name}" creada exitosamente.`);
      return newCompany;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al crear la compañía';
      const error = err instanceof Error ? err : new Error(errorMessage);
      setError(error);
      toast.error("Error al crear compañía", { description: errorMessage });
      throw error; // Re-lanzar para que el componente sepa del error
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { mutate, isLoading, error, data };
} 