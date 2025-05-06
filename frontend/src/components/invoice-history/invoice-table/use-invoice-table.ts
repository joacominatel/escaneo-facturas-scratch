/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { SortingState, PaginationState, RowSelectionState } from "@tanstack/react-table";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useDebounce } from "@/hooks/use-debounce";
import { fetchInvoiceHistory } from "@/lib/api/invoices";
import {
    useWebSocket,
    type InvoiceStatusUpdateData,
} from "@/contexts/websocket-context";
import { InvoiceListItem, InvoiceStatus, FetchInvoiceHistoryOptions } from "@/lib/api/types";
import { toast } from 'sonner';
import { LOCALSTORAGE_KEY_PAGE_SIZE, LOCALSTORAGE_KEY_STATUSES } from './constants';

export function useInvoiceTable() {
    // --- Estados de Datos y Carga --- 
    const [data, setData] = useState<InvoiceListItem[]>([]);
    const dataRef = useRef(data); // <-- Ref para datos actuales
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
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    // --- Estados del WebSocket (desde Contexto) ---
    const {
        isConnected: isWsConnectedState,
        connectError: wsConnectError,
        addStatusUpdateListener,
        removeStatusUpdateListener,
    } = useWebSocket();

    // --- Estado para Highlights --- 
    const [updatedRowIds, setUpdatedRowIds] = useState<Set<number>>(new Set());
    const highlightTimeoutRef = useRef<Map<number, NodeJS.Timeout>>(new Map());

    // --- Estado para el Modal de Detalles ---
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [viewingInvoiceId, setViewingInvoiceId] = useState<number | null>(null);

    // --- Sincronización de selectedStatuses a localStorage --- 
    useEffect(() => {
        // Convertir Set a array ordenado para consistencia en localStorage
        const statusesArray = Array.from(selectedStatuses).sort();
        // Comparar con el valor actual en localStorage (si existe) para evitar escrituras innecesarias
        // Nota: storedStatuses es el valor de la renderización anterior, pero es suficiente para esta comparación
        const currentStoredArray = storedStatuses || []; 
        if (JSON.stringify(statusesArray) !== JSON.stringify([...currentStoredArray].sort())) {
            console.log('[useInvoiceTable] Syncing selectedStatuses to localStorage:', statusesArray);
            setStoredStatuses(statusesArray);
        }
    }, [selectedStatuses, setStoredStatuses, storedStatuses]); // Depender de selectedStatuses y los setters/valores relacionados con localStorage

    useEffect(() => {
        if (pagination.pageSize !== storedPageSize) {
            setStoredPageSize(pagination.pageSize);
        }
    }, [pagination.pageSize, storedPageSize, setStoredPageSize]);

    // --- Lógica de Fetching --- 
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
                search: debouncedSearchTerm || undefined,
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
        debouncedSearchTerm,
        storedStatuses,
        sorting
    ]);

    // --- Efecto para Fetch Inicial y Refetch --- 
    useEffect(() => {
        fetchData(true);
    }, [fetchData]);

    // --- Función para highlight temporal --- 
    const triggerRowHighlight = useCallback((id: number) => {
        // Limpiar timeout anterior para este ID si existe
        if (highlightTimeoutRef.current.has(id)) {
            clearTimeout(highlightTimeoutRef.current.get(id)!);
        }
        // Añadir ID al set para highlight
        setUpdatedRowIds(prev => new Set(prev).add(id));
        // Establecer nuevo timeout para quitar el highlight
        const timeoutId = setTimeout(() => {
            setUpdatedRowIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(id);
                return newSet;
            });
            highlightTimeoutRef.current.delete(id); // Limpiar del mapa de timeouts
        }, 1500); // Duración del highlight
        highlightTimeoutRef.current.set(id, timeoutId); // Guardar el timeout
    }, []);

    // --- Efecto para actualizar dataRef ---
    useEffect(() => {
        dataRef.current = data;
    }, [data]);

    // --- Handler para Actualizaciones de Estado WS ---
    const handleWsStatusUpdate = useCallback((update: InvoiceStatusUpdateData) => {
        console.log("[useInvoiceTable] WS Status Update:", update);

        // Aplicar highlight
        triggerRowHighlight(update.id);

        // Comprobar si la factura existe en los datos actuales usando el ref
        const invoiceExists = dataRef.current.some(inv => inv.id === update.id);

        if (invoiceExists) {
            // Si existe, actualizar el estado in-place
            setData(currentData => {
                const invoiceIndex = currentData.findIndex(inv => inv.id === update.id);
                // Doble check por si acaso, aunque ya sabemos que existe
                if (invoiceIndex !== -1) {
                    const updatedData = [...currentData];
                    updatedData[invoiceIndex] = { ...updatedData[invoiceIndex], status: update.status as InvoiceStatus };
                    console.log("[useInvoiceTable] Actualizando estado in-place.");
                    return updatedData;
                }
                return currentData; // No debería pasar si invoiceExists es true
            });
        } else {
            // Si no existe en los datos actuales, recargar
            console.log(`[useInvoiceTable] Factura ${update.id} no encontrada en datos actuales (ref), recargando...`);
            // No resetear selección al recargar por WS
            fetchData(false);
            // Podríamos mostrar un toast diferente para nuevas facturas
            // toast.info(`Nueva factura recibida: ${update.filename}`);
        }
    }, [fetchData, triggerRowHighlight]); // Ya no depende de data

    // --- Efecto para suscribirse/desuscribirse a los updates --- 
    useEffect(() => {
        console.log("[useInvoiceTable] Efecto: Añadiendo listener de status.");
        addStatusUpdateListener(handleWsStatusUpdate);
        
        // Capturar la referencia actual para usarla en la limpieza
        const currentTimeoutMap = highlightTimeoutRef.current;
        
        return () => {
            console.log("[useInvoiceTable] Limpieza Efecto: Eliminando listener de status.");
            removeStatusUpdateListener(handleWsStatusUpdate);
            // Limpiar todos los timeouts pendientes al desmontar usando la referencia capturada
            currentTimeoutMap.forEach(timeoutId => clearTimeout(timeoutId));
            currentTimeoutMap.clear();
        };
    }, [addStatusUpdateListener, removeStatusUpdateListener, handleWsStatusUpdate]);
    
    // --- Efecto para mostrar errores de conexión WS (del contexto) ---
    useEffect(() => {
        if (wsConnectError) {
            toast.error('Error de Conexión Live (Historial)', { description: wsConnectError.message });
        }
    }, [wsConnectError]);

    // --- Handlers para la Tabla --- 
    const handlePaginationChange = useCallback((updater: any) => {
        setRowSelection({});
        setPagination(updater);
    }, [setPagination]);

    const resetFilters = useCallback(() => {
        setSearchTerm("");
        setSelectedStatuses(new Set());
        setPagination(p => ({ ...p, pageIndex: 0 }));
        setRowSelection({});
    }, [setSelectedStatuses, setPagination]);

    const hasActiveFilters = useMemo(() => {
        return searchTerm !== "" || selectedStatuses.size > 0;
    }, [searchTerm, selectedStatuses]);

    // --- Handlers para el Modal ---
    const handleViewDetails = useCallback((invoiceId: number) => {
        setViewingInvoiceId(invoiceId);
        setIsDetailModalOpen(true);
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
        searchTerm,
        selectedStatuses,
        updatedRowIds,
        // Estados WS del contexto
        isWsConnected: isWsConnectedState,
        wsConnectError,
        // Indicadores
        hasActiveFilters,
        isDetailModalOpen,
        viewingInvoiceId,
        // Setters y Handlers
        setSorting,
        setPagination: handlePaginationChange,
        setRowSelection,
        setSelectedStatuses,
        setSearchTerm,
        fetchData,
        resetFilters,
        openDetailsModal: handleViewDetails,
        setIsDetailModalOpen,
    };
}