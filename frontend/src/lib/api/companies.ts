import { apiRequest, ApiError, getApiBaseUrl } from './client'
import type { Company, CompanyPrompt } from "./types";

/**
 * Obtiene la lista de todas las compañías.
 * @returns Promise<Company[]>
 */
export const listCompanies = async (): Promise<Company[]> => {
  return await apiRequest<Company[]>("/api/companies/");
};

/**
 * Obtiene los detalles de una compañía específica.
 * @param companyId - ID de la compañía.
 * @returns Promise<Company>
 */
export const getCompanyDetails = async (companyId: number): Promise<Company> => {
  return await apiRequest<Company>(`/api/companies/${companyId}`);
};

/**
 * Obtiene la lista de prompts para una compañía específica.
 * @param companyId - ID de la compañía.
 * @returns Promise<CompanyPrompt[]>
 */
export const listCompanyPrompts = async (companyId: number): Promise<CompanyPrompt[]> => {
  return await apiRequest<CompanyPrompt[]>(`/api/companies/${companyId}/prompts`);
};

/** /<int:company_id>/prompts/<int:prompt_id>/content
 * Obtiene el contenido textual de un prompt específico.
 * @param companyId - ID de la compañía.
 * @param promptId - ID del prompt (CompanyPrompt.id).
 * @returns Promise<string>
 */
export const getPromptContent = async (companyId: number, promptId: number): Promise<string> => {
  const url = `${getApiBaseUrl()}/api/companies/${companyId}/prompts/${promptId}/content`;
  try {
    const response = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'text/plain' }
    });

    if (!response.ok) {
        let errorDetails = response.statusText;
        if (response.headers.get('content-type')?.includes('application/json')) {
            try {
                const errJson = await response.json();
                errorDetails = errJson.error || errorDetails;
            } catch {}
        }
        throw new ApiError(
            `Failed to get prompt content: ${response.status} ${errorDetails}`,
            response.status,
            { error: errorDetails }
        );
    }
    return (await response.json()).content;

  } catch (error) {
    console.error(`Error fetching content for prompt ${promptId}:`, error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(`Network or fetch error getting prompt content: ${(error as Error).message}`, 0);
  }
};

/**
 * Actualiza el prompt por defecto de una compañía.
 * @param companyId - ID de la compañía.
 * @param promptContent - Nuevo contenido del prompt.
 * @returns Promise<CompanyPrompt> - El nuevo prompt creado.
 */
export const updateCompanyDefaultPrompt = async (companyId: number, promptContent: string): Promise<CompanyPrompt> => {
  return await apiRequest<CompanyPrompt>(`/api/companies/${companyId}/prompt`, {
    method: 'PUT',
    body: JSON.stringify({ prompt_content: promptContent }),
  });
};

/**
 * Marca un prompt específico como el por defecto para una compañía.
 * ASUNCIÓN: Endpoint PUT /api/companies/{company_id}/prompts/{prompt_id}/set_default existe.
 * @param companyId - ID de la compañía.
 * @param promptId - ID del prompt a marcar como default.
 * @returns Promise<void> - No devuelve contenido en éxito.
 */
export const setPromptAsDefault = async (companyId: number, promptId: number): Promise<void> => {
  await apiRequest<void>(`/api/companies/${companyId}/prompts/${promptId}/set_default`, {
    method: 'POST',
  });
};

// TODO: Considerar añadir funciones para crear/eliminar compañías si es necesario. 