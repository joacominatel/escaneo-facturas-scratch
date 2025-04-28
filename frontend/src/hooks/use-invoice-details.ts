import { useState, useCallback } from 'react';
import { fetchInvoiceDetails } from "@/lib/api/invoices";
import type { InvoiceDetail } from "@/lib/api/types";
import { ApiError } from "@/lib/api/client";
import { toast } from 'sonner';

interface UseInvoiceDetailsReturn {
    details: InvoiceDetail | null;
    isLoading: boolean;
    error: string | null;
    fetchDetails: (id: number) => Promise<void>;
    resetDetails: () => void;
}

export function useInvoiceDetails(): UseInvoiceDetailsReturn {
    const [details, setDetails] = useState<InvoiceDetail | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const fetchDetails = useCallback(async (id: number) => {
        if (!id) return;
        setIsLoading(true);
        setError(null);
        setDetails(null); // Limpiar detalles previos
        try {
            const data = await fetchInvoiceDetails(id);
            if (data) {
                setDetails(data);
            } else {
                // fetchInvoiceDetails devuelve null si es 404
                setError("Factura no encontrada.");
                toast.error("Factura no encontrada", { description: `No se encontró la factura con ID ${id}.` });
            }
        } catch (err) {
            console.error(`Error fetching details for invoice ${id}:`, err);
            const errorMessage = err instanceof ApiError
                ? err.message
                : (err instanceof Error ? err.message : "Ocurrió un error desconocido");
            setError(errorMessage);
            toast.error("Error al cargar detalles", { description: errorMessage });
        } finally {
            setIsLoading(false);
        }
    }, []);

    const resetDetails = useCallback(() => {
        setDetails(null);
        setError(null);
        setIsLoading(false);
    }, []);

    return { details, isLoading, error, fetchDetails, resetDetails };
} 