/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, useRef } from 'react';
import { apiRequest, ApiError } from '@/lib/api/client';
import {
    addPreviewUpdateListener,
    removePreviewUpdateListener,
    joinRoom,
    leaveRoom,
    type InvoicePreviewUpdateData
} from '@/lib/ws/invoice-updates';

interface UseInvoicePreviewEditProps {
    invoiceId: number | null;
    initialPreviewData: Record<string, any> | null;
    debounceTimeout?: number; // Opcional: para debouncing antes de guardar
}

interface UseInvoicePreviewEditReturn {
    previewData: Record<string, any> | null;
    setPreviewData: React.Dispatch<React.SetStateAction<Record<string, any> | null>>;
    updatePreviewData: (updatedData: Record<string, any>) => void; // Función para actualizar una parte
    saveChanges: () => Promise<void>;
    isSaving: boolean;
    isModified: boolean;
    error: string | null;
    lastSavedData: Record<string, any> | null; // Para comparar si hay cambios
}

export function useInvoicePreviewEdit({
    invoiceId,
    initialPreviewData,
}: UseInvoicePreviewEditProps): UseInvoicePreviewEditReturn {
    const [previewData, setPreviewData] = useState<Record<string, any> | null>(initialPreviewData);
    const [lastSavedData, setLastSavedData] = useState<Record<string, any> | null>(initialPreviewData);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isModified, setIsModified] = useState(false);

    // Usamos useRef para asegurar que los callbacks de WS tengan los datos más recientes
    const previewDataRef = useRef(previewData);
    useEffect(() => {
        previewDataRef.current = previewData;
        // Comprobar si hay modificaciones
        setIsModified(JSON.stringify(previewData) !== JSON.stringify(lastSavedData));
    }, [previewData, lastSavedData]);

    const roomName = invoiceId ? `invoice_${invoiceId}` : null;

    // Efecto para unirse/salir del room y suscribirse/desuscribirse a WS
    useEffect(() => {
        if (!roomName || !invoiceId) return;

        console.log(`[Hook] Uniendo al room: ${roomName}`);
        joinRoom(roomName);

        const handlePreviewUpdate = (data: InvoicePreviewUpdateData) => {
            if (data.id === invoiceId) {
                console.log(`[Hook] Preview update recibido de WS para ${invoiceId}:`, data.preview_data);
                // Solo actualizamos si los datos recibidos son diferentes a los actuales
                // para evitar loops si el propio cliente causó la actualización.
                // OJO: Esta lógica puede necesitar ajuste. Si OTRO usuario edita,
                // ¿queremos sobreescribir los cambios locales no guardados?
                // Por ahora, actualizamos si es diferente, priorizando la versión del server.
                if (JSON.stringify(data.preview_data) !== JSON.stringify(previewDataRef.current)) {
                     console.log("[Hook] Actualizando estado local desde WS...");
                     setPreviewData(data.preview_data);
                     setLastSavedData(data.preview_data); // Considerar esto como el nuevo "guardado"
                     setError(null); // Limpiar error si la actualización WS funciona
                     setIsModified(false); // Ya no está modificado respecto al server
                }
            }
        };

        addPreviewUpdateListener(handlePreviewUpdate);

        return () => {
            if (roomName) {
                console.log(`[Hook] Saliendo del room: ${roomName}`);
                leaveRoom(roomName);
                removePreviewUpdateListener(handlePreviewUpdate);
            }
        };
    }, [invoiceId, roomName]); // Depende del ID de la factura

    // Función para actualizar partes del previewData (más útil para formularios)
    const updatePreviewData = useCallback((updatedPart: Record<string, any>) => {
        setPreviewData(prevData => ({ ...prevData, ...updatedPart }));
    }, []);

    // Función para guardar los cambios
    const saveChanges = useCallback(async () => {
        if (!invoiceId || !previewData || !isModified) {
            console.log("[Hook] No se guarda: sin ID, datos, o sin modificaciones.");
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            console.log(`[Hook] Guardando cambios para factura ${invoiceId}...`);
            await apiRequest(`/api/invoices/${invoiceId}/preview`, {
                method: 'PATCH',
                body: JSON.stringify({
                    preview_data: previewData
                }),
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            console.log(`[Hook] Cambios guardados exitosamente para ${invoiceId}`);
            setLastSavedData(previewData);
            setIsModified(false);

        } catch (err) {
            console.error("[Hook] Error al guardar cambios:", err);
            let errorMessage = "Error desconocido al guardar.";
            if (err instanceof ApiError) {
                 errorMessage = err.errorData?.error || err.message;
            } else if (err instanceof Error) {
                errorMessage = err.message;
            }
            setError(errorMessage);
        } finally {
            setIsSaving(false);
        }
    }, [invoiceId, previewData, isModified]);

    // Podrías usar useDebounce aquí si quisieras auto-guardado
    // const debouncedSaveChanges = useDebounce(saveChanges, debounceTimeout);
    // useEffect(() => {
    //     if (isModified) {
    //         debouncedSaveChanges();
    //     }
    // }, [previewData, isModified, debouncedSaveChanges]);

    return {
        previewData,
        setPreviewData, // Permitir sobreescritura completa si es necesario
        updatePreviewData,
        saveChanges,
        isSaving,
        isModified,
        error,
        lastSavedData
    };
} 