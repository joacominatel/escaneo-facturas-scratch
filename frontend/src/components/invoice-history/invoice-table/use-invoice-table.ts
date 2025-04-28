import { useState, useEffect, useCallback, useMemo } from 'react';
import { SortingState, PaginationState, RowSelectionState } from "@tanstack/react-table";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useDebounce } from "@/hooks/use-debounce";
import { fetchInvoiceHistory } from "@/lib/api/invoices";
import {
    connectToInvoiceUpdates,
    disconnectFromInvoiceUpdates,
    isInvoiceSocketConnected,
} from "@/lib/ws/invoice-updates";
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

    // --- Estados del WebSocket --- 
    const [isLive, setIsLive] = useState(false);
    const [isConnectingWs, setIsConnectingWs] = useState(false);

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
        fetchData(true); // Reset selection on initial load & dependency changes
    }, [fetchData]);

    // --- Handlers y Lógica del WebSocket --- 
    const handleWsConnect = useCallback(() => {
        console.log("[useInvoiceTable] handleWsConnect ejecutado."); // <-- Log añadido
        setIsConnectingWs(false);
        setIsLive(true);
        // Opcional: toast o log
    }, []);

    const handleWsDisconnect = useCallback((reason: unknown) => {
        console.warn("[useInvoiceTable] handleWsDisconnect ejecutado. Razón:", reason); // <-- Log añadido
        setIsConnectingWs(false);
        setIsLive(false);
        // Opcional: toast o log (evitar si es manual)
        // if (String(reason) !== 'io client disconnect') { ... }
    }, []);

    const handleWsConnectError = useCallback((error: Error) => {
        console.error("[useInvoiceTable] handleWsConnectError ejecutado:", error); // <-- Log añadido
        setIsConnectingWs(false);
        setIsLive(false);
        toast.error('Error conexión Live', { description: error.message });
    }, []);

    const handleWsStatusUpdate = useCallback((update: { id: number; status: string; filename: string }) => {
        console.log("[useInvoiceTable] handleWsStatusUpdate ejecutado con datos:", update); // <-- Log añadido
        setData(currentData => {
            console.log("[useInvoiceTable] Actualizando estado 'data'..."); // <-- Log añadido
            const updatedData = currentData.map(invoice =>
                invoice.id === update.id ? { ...invoice, status: update.status as InvoiceStatus } : invoice
            );
            // Comprobar si realmente hubo cambios
            const changed = JSON.stringify(updatedData) !== JSON.stringify(currentData);
            console.log("[useInvoiceTable] ¿Estado 'data' cambiado?", changed); // <-- Log añadido
            return updatedData;
        });
        // Opcional: Toast
        // toast.info(...)
    }, []);

    const toggleLiveUpdates = useCallback(() => {
        if (isLive) {
            disconnectFromInvoiceUpdates();
        } else {
            setIsConnectingWs(true);
            connectToInvoiceUpdates({
                onConnect: handleWsConnect,
                onDisconnect: handleWsDisconnect,
                onConnectError: handleWsConnectError,
                onStatusUpdate: handleWsStatusUpdate,
            });
        }
    }, [isLive, handleWsConnect, handleWsDisconnect, handleWsConnectError, handleWsStatusUpdate]);

    // Sincronizar estado local con estado global del socket y limpiar al desmontar
    useEffect(() => {
        setIsLive(isInvoiceSocketConnected()); // Sincronizar estado inicial
        const interval = setInterval(() => setIsLive(isInvoiceSocketConnected()), 3000); // Sincronización periódica
        return () => {
            clearInterval(interval);
            // Opcional: Desconectar al desmontar el hook/componente
            // if (isInvoiceSocketConnected()) disconnectFromInvoiceUpdates();
        };
    }, []);

    // --- Handlers para la Tabla --- 
    const handlePaginationChange = useCallback((updater: any) => {
        setRowSelection({}); // Resetear selección al cambiar página/tamaño
        setPagination(updater);
    }, [setPagination]);

    const resetFilters = useCallback(() => {
        setSearchTerm("");
        setSelectedStatuses(new Set()); // Esto dispara el useEffect que limpia storedStatuses
        setPagination(p => ({ ...p, pageIndex: 0 })); // Resetear a página 1
        setRowSelection({});
    }, [setSelectedStatuses, setPagination]); // Incluir setters

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
        searchTerm,
        selectedStatuses,
        isLive,
        isConnectingWs,
        hasActiveFilters,
        isDetailModalOpen,
        viewingInvoiceId,
        // Setters y Handlers
        setSorting,
        setPagination: handlePaginationChange,
        setRowSelection,
        setSearchTerm,
        setSelectedStatuses,
        toggleLiveUpdates,
        fetchData,
        resetFilters,
        openDetailsModal: handleViewDetails,
        setIsDetailModalOpen,
    };
}