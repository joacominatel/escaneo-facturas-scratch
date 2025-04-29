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

    // --- Handler para Actualizaciones de Estado WS ---
    const handleWsStatusUpdate = useCallback((update: InvoiceStatusUpdateData) => {
        console.log("[useInvoiceTable] WS Status Update:", update);
        setData(currentData => {
            const invoiceIndex = currentData.findIndex(inv => inv.id === update.id);
            if (invoiceIndex === -1) {
                console.log(`[useInvoiceTable] Factura ${update.id} no encontrada en la página actual.`);
                // Considerar si queremos recargar o notificar de alguna forma
                // fetchData(); // Podría ser una opción si queremos verla si cumple filtros
                // toast.info(`Factura ${update.filename} (fuera de vista) actualizada.`);
                return currentData;
            }

            const updatedData = [...currentData];
            updatedData[invoiceIndex] = { ...updatedData[invoiceIndex], status: update.status as InvoiceStatus };
            console.log("[useInvoiceTable] Actualizando estado de la factura en la tabla.");
            return updatedData;
        });
    }, []); // Sin dependencias externas

    // --- Efecto para suscribirse/desuscribirse a los updates --- 
    useEffect(() => {
        console.log("[useInvoiceTable] Efecto: Añadiendo listener de status.");
        addStatusUpdateListener(handleWsStatusUpdate);
        
        // Limpieza
        return () => {
            console.log("[useInvoiceTable] Limpieza Efecto: Eliminando listener de status.");
            removeStatusUpdateListener(handleWsStatusUpdate);
        };
    }, [addStatusUpdateListener, removeStatusUpdateListener, handleWsStatusUpdate]);
    
    // --- Efecto para mostrar errores de conexión WS (del contexto) ---
    useEffect(() => {
        if (wsConnectError) {
            toast.error('Error de Conexión Live (Historial)', { description: wsConnectError.message });
            // Ya no necesitamos desactivar un toggle `isLive` porque no existe
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

    const handleCloseDetailsModal = useCallback(() => {
        setIsDetailModalOpen(false);
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
        // Estados WS del contexto
        isWsConnected: isWsConnectedState,
        wsConnectError, // Exponer el error si es necesario
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