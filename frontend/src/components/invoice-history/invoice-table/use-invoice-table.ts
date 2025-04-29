import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { SortingState, PaginationState, RowSelectionState } from "@tanstack/react-table";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { fetchInvoiceHistory } from "@/lib/api/invoices";
import {
    disconnect,
    isConnected,
    addStatusUpdateListener,
    removeStatusUpdateListener,
    addConnectListener,
    removeConnectListener,
    addDisconnectListener,
    removeDisconnectListener,
    addConnectErrorListener,
    removeConnectErrorListener,
    type InvoiceStatusUpdateData
} from "@/lib/ws/invoice-updates";
import { InvoiceListItem, InvoiceStatus, FetchInvoiceHistoryOptions } from "@/lib/api/types";
import { toast } from 'sonner';
import { LOCALSTORAGE_KEY_PAGE_SIZE, LOCALSTORAGE_KEY_STATUSES } from './constants';
import { useSearchParams } from 'next/navigation';

export function useInvoiceTable() {
    // --- Estados de Datos y Carga --- 
    const [data, setData] = useState<InvoiceListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [totalCount, setTotalCount] = useState(0);

    // --- Estados Persistidos --- 
    const [storedStatuses, setStoredStatuses] = useLocalStorage<InvoiceStatus[]>(
        LOCALSTORAGE_KEY_STATUSES,
        []
    );
    const [selectedStatuses, setSelectedStatuses] = useState<Set<InvoiceStatus>>(() => new Set(storedStatuses));

    const [storedPageSize, setStoredPageSize] = useLocalStorage<number>(
        LOCALSTORAGE_KEY_PAGE_SIZE,
        10
    );

    // --- Estados de la Tabla --- 
    const [sorting, setSorting] = useState<SortingState>([{ id: 'created_at', desc: true }]);
    const [pagination, setPagination] = useState<PaginationState>(() => ({
        pageIndex: 0,
        pageSize: storedPageSize,
    }));
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

    // --- Estados del WebSocket --- 
    const [isLive, setIsLive] = useState(false);
    const [isWsConnectedState, setIsWsConnectedState] = useState(isConnected());
    const [isConnectingWs, setIsConnectingWs] = useState(false);

    // Ref para listeners inicializada directamente
    const wsListenersRef = useRef<{
        onConnect: () => void;
        onDisconnect: (reason: any, description?: any) => void;
        onConnectError: (error: Error) => void;
        onStatusUpdate: (data: InvoiceStatusUpdateData) => void;
    }>({
        onConnect: () => { /* Implementado abajo */ },
        onDisconnect: () => { /* Implementado abajo */ },
        onConnectError: () => { /* Implementado abajo */ },
        onStatusUpdate: () => { /* Implementado abajo */ },
    });

    // --- Estado para el Modal de Detalles ---
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [viewingInvoiceId, setViewingInvoiceId] = useState<number | null>(null);

    // --- Sincronización con localStorage --- 
    useEffect(() => {
        const currentStoredArray = storedStatuses || [];
        const currentSetArray = Array.from(selectedStatuses);
        if (JSON.stringify(currentSetArray.sort()) !== JSON.stringify([...currentStoredArray].sort())) {
            setStoredStatuses(currentSetArray);
        }
    }, [selectedStatuses, setStoredStatuses, storedStatuses]);

    useEffect(() => {
        const currentStoredArray = storedStatuses || [];
        const currentSetArray = Array.from(selectedStatuses);
        if (JSON.stringify(currentSetArray.sort()) !== JSON.stringify([...currentStoredArray].sort())) {
            setSelectedStatuses(new Set(currentStoredArray));
        }
    }, [storedStatuses]);

    useEffect(() => {
        if (pagination.pageSize !== storedPageSize) {
            setStoredPageSize(pagination.pageSize);
        }
    }, [pagination.pageSize, storedPageSize, setStoredPageSize]);

    // --- Lógica de Fetching --- 
    const searchParams = useSearchParams();
    const urlSearchTerm = searchParams.get('search') || "";

    const fetchData = useCallback(async (resetSelection = false) => {
        setIsLoading(true);
        setError(null);
        if (resetSelection) {
            setRowSelection({});
        }
        try {
            const options: FetchInvoiceHistoryOptions = {
                page: pagination.pageIndex + 1,
                perPage: pagination.pageSize,
                search: urlSearchTerm || undefined,
                status: storedStatuses.length > 0 ? storedStatuses : undefined,
                sortBy: sorting[0]?.id,
                sortOrder: sorting[0]?.desc ? 'desc' : 'asc',
            };
            const result = await fetchInvoiceHistory(options);
            setData(result.invoices);
            setTotalCount(result.total);
        } catch (err: any) {
            console.error("Error fetching invoice history:", err);
            setError(err.message || "Failed to fetch invoices");
            setData([]);
            setTotalCount(0);
            toast.error("Error al cargar facturas", { description: err.message });
        } finally {
            setIsLoading(false);
        }
    }, [
        pagination.pageIndex,
        pagination.pageSize,
        urlSearchTerm,
        storedStatuses,
        sorting
    ]);

    // --- Efecto para Fetch Inicial y Refetch --- 
    useEffect(() => {
        fetchData(true);
    }, [fetchData]);

    // --- Definición de Handlers WS --- 
    // Usamos useCallback para los handlers, pero la ref los hará estables
    const handleWsConnect = useCallback(() => {
        console.log("[useInvoiceTable] WS Connected!");
        setIsConnectingWs(false);
        setIsWsConnectedState(true); 
    }, []);

    const handleWsDisconnect = useCallback((reason: any, description?: any) => {
        console.warn("[useInvoiceTable] WS Disconnected. Razón:", reason, description);
        setIsConnectingWs(false);
        setIsWsConnectedState(false); 
        if (isLive && reason !== 'io client disconnect') {
            toast.error("Conexión Live perdida", { description: `Razón: ${reason}` });
        }
    }, [isLive]); // Depende de isLive para mostrar el toast

    const handleWsConnectError = useCallback((error: Error) => {
        console.error("[useInvoiceTable] WS Connection Error:", error);
        setIsConnectingWs(false);
        setIsWsConnectedState(false); 
        toast.error('Error conexión Live', { description: error.message });
        setIsLive(false); // Desactivar toggle si falla
    }, []);

    const handleWsStatusUpdate = useCallback((update: InvoiceStatusUpdateData) => {
        console.log("[useInvoiceTable] WS Status Update:", update);
        setData(currentData => {
            // Importante: Comprobar si la factura está visible con los filtros actuales
            // Opcional: Si no está visible, podrías simplemente ignorar la actualización
            //           o mostrar una notificación diferente.
            const invoiceIndex = currentData.findIndex(inv => inv.id === update.id);
            if (invoiceIndex === -1) {
                console.log(`[useInvoiceTable] Factura ${update.id} no encontrada en la página actual.`);
                // Podrías mostrar un toast indicando que una factura fuera de vista cambió.
                // toast.info(`Factura ${update.filename} (fuera de vista) actualizada a ${update.status}`);
                return currentData; // No modificar datos si no está visible
            }

            const updatedData = [...currentData];
            updatedData[invoiceIndex] = { ...updatedData[invoiceIndex], status: update.status as InvoiceStatus };
            console.log("[useInvoiceTable] Actualizando estado de la factura en la tabla.");
            return updatedData;
        });
    }, []);

    // Actualizar la ref cuando los handlers cambien (debido a dependencias como isLive)
    useEffect(() => {
        wsListenersRef.current = {
            onConnect: handleWsConnect,
            onDisconnect: handleWsDisconnect,
            onConnectError: handleWsConnectError,
            onStatusUpdate: handleWsStatusUpdate,
        };
    }, [handleWsConnect, handleWsDisconnect, handleWsConnectError, handleWsStatusUpdate]);

    // --- Efecto para conectar/desconectar y añadir/remover listeners --- 
    useEffect(() => {
        if (isLive) {
            console.log("[useInvoiceTable] useEffect[isLive]: Activando Live Updates...");
            setIsConnectingWs(true);
            // Añadir listeners (asegurándose de usar la versión más reciente de la ref)
            const currentListeners = wsListenersRef.current;
            addConnectListener(currentListeners.onConnect);
            addDisconnectListener(currentListeners.onDisconnect);
            addConnectErrorListener(currentListeners.onConnectError);
            addStatusUpdateListener(currentListeners.onStatusUpdate);
            // La llamada a add*Listener internamente llama a ensureConnected
            
             // Sincronizar estado inicial después de intentar añadir listeners
             setIsWsConnectedState(isConnected());
             if (isConnected()) {
                 setIsConnectingWs(false); // Si ya estaba conectado, no estamos conectando
             }

        } else {
             console.log("[useInvoiceTable] useEffect[isLive]: Desactivando Live Updates...");
            // Remover listeners usando la versión de la ref
            const currentListeners = wsListenersRef.current;
            removeConnectListener(currentListeners.onConnect);
            removeDisconnectListener(currentListeners.onDisconnect);
            removeConnectErrorListener(currentListeners.onConnectError);
            removeStatusUpdateListener(currentListeners.onStatusUpdate);
            disconnect(); // Desconectar explícitamente
            setIsConnectingWs(false);
            setIsWsConnectedState(false);
        }

        // Función de limpieza del efecto
        return () => {
            console.log("[useInvoiceTable] Limpieza useEffect[isLive]: Removiendo listeners...");
            // Siempre remover listeners al desmontar o si isLive cambia a false
            const currentListeners = wsListenersRef.current;
            removeConnectListener(currentListeners.onConnect);
            removeDisconnectListener(currentListeners.onDisconnect);
            removeConnectErrorListener(currentListeners.onConnectError);
            removeStatusUpdateListener(currentListeners.onStatusUpdate);
             // Opcional: ¿Desconectar si el componente se desmonta incluso si isLive era true?
             // if (isLive) disconnect(); 
        };
    }, [isLive]); // Ejecutar solo cuando isLive cambia

    // --- Toggle para el Usuario --- 
    const toggleLiveUpdates = useCallback(() => {
        console.log("[useInvoiceTable] toggleLiveUpdates llamado.");
        setIsLive(prev => !prev); // Simplemente cambia el estado deseado por el usuario
    }, []);

    // --- Handlers para la Tabla --- 
    const handlePaginationChange = useCallback((updater: any) => {
        setRowSelection({});
        setPagination(updater);
    }, [setPagination]);

    const resetFilters = useCallback(() => {
        setSelectedStatuses(new Set());
        setPagination(p => ({ ...p, pageIndex: 0 }));
        setRowSelection({});
    }, [setSelectedStatuses, setPagination]);

    const hasActiveFilters = useMemo(() => {
        return urlSearchTerm !== "" || selectedStatuses.size > 0;
    }, [urlSearchTerm, selectedStatuses]);

    // --- Handlers para el Modal ---
    const handleViewDetails = useCallback((invoiceId: number) => {
        setViewingInvoiceId(invoiceId);
        setIsDetailModalOpen(true);
    }, []);

    const handleCloseDetailsModal = useCallback(() => {
        setIsDetailModalOpen(false);
        // Podríamos resetear el ID aquí o esperar a que el modal lo haga al cerrarse
        // setViewingInvoiceId(null);
    }, []);

    // --- Valor de Retorno del Hook --- 
    return {
        // Estado
        data,
        isLoading,
        error,
        totalCount,
        sorting,
        pagination,
        rowSelection,
        urlSearchTerm,
        selectedStatuses,
        isLive,
        isConnectingWs,
        isWsConnected: isWsConnectedState,
        hasActiveFilters,
        isDetailModalOpen,
        viewingInvoiceId,
        // Setters y Handlers
        setSorting,
        setPagination: handlePaginationChange,
        setRowSelection,
        setSelectedStatuses,
        toggleLiveUpdates,
        fetchData,
        resetFilters,
        openDetailsModal: handleViewDetails,
        setIsDetailModalOpen,
    };
}