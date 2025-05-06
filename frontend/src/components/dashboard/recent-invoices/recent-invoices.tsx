"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { fetchRecentInvoices } from "@/lib/api/invoices";
import { useWebSocket, type InvoiceStatusUpdateData } from "@/contexts/websocket-context";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { InvoiceStatus, InvoiceListItem } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useLocalStorage } from "@/hooks/use-local-storage";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { InvoiceActions } from "@/components/invoice-history/invoice-actions";

// Clave para localStorage
const LOCALSTORAGE_KEY_RECENT_LIMIT = 'recentInvoicesLimit';

// Helper function to get badge variant based on status
const getStatusVariant = (
  status: InvoiceStatus
): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case "processed":
      return "default";
    case "waiting_validation":
      return "secondary";
    case "processing":
      return "secondary";
    case "failed":
    case "rejected":
      return "destructive";
    case "duplicated":
      return "outline";
    default:
      return "default";
  }
};

// Helper function to get status text in Spanish
const getStatusText = (status: InvoiceStatus): string => {
  switch (status) {
    case "processed":
      return "Procesado";
    case "waiting_validation":
      return "Esperando Validación";
    case "processing":
      return "Procesando";
    case "failed":
      return "Fallido";
    case "rejected":
      return "Rechazado";
    case "duplicated":
      return "Duplicado";
    default:
      return status;
  }
};

export default function RecentInvoices() {
    // Estado para datos y carga/error
    const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [highlightedInvoiceId, setHighlightedInvoiceId] = useState<number | null>(null);
    const highlightTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // --- Estado para el límite --- 
    const [limit, setLimit] = useLocalStorage<number>(
        LOCALSTORAGE_KEY_RECENT_LIMIT,
        5 // Valor inicial
    );

    // --- Estado WebSocket desde el Contexto ---
    const { 
        isConnected: isWsConnectedState, 
        connectError: wsConnectError, 
        addStatusUpdateListener, // Obtener funciones del contexto
        removeStatusUpdateListener 
    } = useWebSocket();

    // Fetch inicial de datos
    const loadRecentInvoices = useCallback(async () => {
        // No resetear loading si ya estamos mostrando facturas y es una recarga
        if (invoices.length === 0) {
            setIsLoading(true);
        }
        setError(null);
        try {
            // Usar el límite del estado
            const fetchedInvoices = await fetchRecentInvoices(limit);
            setInvoices(fetchedInvoices);
        } catch (err) {
            console.error("Error fetching recent invoices:", err);
            setError(err instanceof Error ? err : new Error("Failed to load invoices"));
            setInvoices([]);
        } finally {
            setIsLoading(false);
        }
    }, [invoices.length, limit]);

    useEffect(() => {
        loadRecentInvoices();
    }, [loadRecentInvoices]);

    // Función para manejar el highlight temporal
    const triggerHighlight = (id: number) => {
        if (highlightTimeoutRef.current) {
            clearTimeout(highlightTimeoutRef.current);
        }
        setHighlightedInvoiceId(id);
        highlightTimeoutRef.current = setTimeout(() => {
            setHighlightedInvoiceId(null);
        }, 1500); // Duración del highlight (ajustar con CSS)
    };

    // --- Handler para Actualizaciones de Estado WS --- 
    // Usamos useCallback para memoizar la función del listener
    const handleStatusUpdate = useCallback((update: InvoiceStatusUpdateData) => {
        console.log('RecentInvoices WS Update:', update);
        
        // Aplicar highlight
        triggerHighlight(update.id);
        
        setInvoices(currentInvoices => {
            const index = currentInvoices.findIndex(inv => inv.id === update.id);
            if (index !== -1) {
                 toast.info(`Factura ${update.filename} actualizada a ${getStatusText(update.status as InvoiceStatus)}`, {
                      description: "Estado actualizado en lista reciente."
                  });
                const newInvoices = [...currentInvoices];
                newInvoices[index] = { ...newInvoices[index], status: update.status as InvoiceStatus };
                return newInvoices;
            } else {
                 // Si la factura no está en la lista, es nueva (o salió del top 5)
                 // Recargar la lista para ver si ahora aparece
                 console.log(`Factura ${update.id} no encontrada en recientes, recargando...`);
                 // Llamar fuera del setInvoices para evitar problemas de ciclo
                 setTimeout(loadRecentInvoices, 100); // Pequeño delay opcional
                 toast.info(`Nueva factura recibida: ${update.filename}`, {
                    description: `Estado inicial: ${getStatusText(update.status as InvoiceStatus)}`
                 });
            }
            return currentInvoices; // Devolver estado actual mientras se recarga
        });
    }, [loadRecentInvoices]);

    // --- Efecto para suscribirse/desuscribirse a los updates --- 
    useEffect(() => {
        console.log("[RecentInvoices] Efecto: Añadiendo listener de status.");
        addStatusUpdateListener(handleStatusUpdate);

        // Limpieza: eliminar el listener cuando el componente se desmonte
        return () => {
            console.log("[RecentInvoices] Limpieza Efecto: Eliminando listener de status.");
            removeStatusUpdateListener(handleStatusUpdate);
            if (highlightTimeoutRef.current) {
                clearTimeout(highlightTimeoutRef.current); // Limpiar timeout al desmontar
            }
        };
    }, [addStatusUpdateListener, removeStatusUpdateListener, handleStatusUpdate]); // Dependencias correctas

    // --- Efecto para mostrar errores de conexión WS (del contexto) ---
    useEffect(() => {
        if (wsConnectError) {
            toast.error('Error de Conexión Live (Dashboard)', { description: wsConnectError.message });
        }
    }, [wsConnectError]);

    // --- Handler para "Ver Detalles" (Placeholder) ---
    const handleViewDetails = (invoiceId: number) => {
        // Por ahora, solo mostramos un toast. Podríamos redirigir si fuera necesario.
        toast.info("Acción no disponible aquí", {
             description: `Para ver detalles de la factura ${invoiceId}, ve al Historial.`
         });
        // Ejemplo de redirección (necesitaría importar useRouter):
        // router.push(`/history?search=${invoiceId}`); 
    };

    // --- Renderizado --- 
    const renderConnectionStatus = () => {
        let color = "bg-gray-400";
        let title = "Live Desconectado";
        // Ya no hay estado "connecting" local, el provider maneja eso.
        // Si hay un error, mostramos desconectado (o podríamos añadir estado de error)
        if (isWsConnectedState) {
            color = "bg-green-500";
            title = "Live Conectado";
        } else if (wsConnectError) {
             color = "bg-red-500";
             title = "Error Conexión Live";
        }

        return (
            <div className="flex items-center space-x-2" title={title}>
                <span className={cn("h-3 w-3 rounded-full", color)}></span>
                <span className="text-xs text-muted-foreground hidden sm:inline">
                    {title}
                </span>
            </div>
        );
    };

    return (
        <div className="lg:col-span-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div>
                        <CardTitle className="text-lg font-medium">
                            Facturas Recientes
                        </CardTitle>
                        <CardDescription>Últimas {limit} facturas recibidas.</CardDescription>
                    </div>
                    <div className="flex items-center space-x-4">
                        {/* Selector de Límite */}
                         <Select 
                             value={String(limit)} 
                             onValueChange={(value) => setLimit(Number(value))}
                        >
                            <SelectTrigger className="w-[80px] h-8 text-xs" aria-label="Seleccionar cantidad">
                                <SelectValue placeholder="Límite" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="3">3</SelectItem>
                                <SelectItem value="5">5</SelectItem>
                                <SelectItem value="10">10</SelectItem>
                            </SelectContent>
                        </Select>
                        {renderConnectionStatus()}
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading && (
                        <div className="space-y-2 mt-4">
                            {[...Array(5)].map((_, i) => (
                                <Skeleton key={i} className="h-10 w-full rounded-md" />
                            ))}
                        </div>
                    )}
                    {!isLoading && error && (
                        <div className="text-red-600 dark:text-red-400 mt-4 text-center py-6">
                            <p>Error al cargar facturas.</p>
                        </div>
                    )}
                    {!isLoading && !error && invoices.length === 0 && (
                        <p className="text-muted-foreground mt-4 text-center py-6">
                            No hay facturas recientes.
                        </p>
                    )}
                    {!isLoading && !error && invoices.length > 0 && (
                        <Table>
                            <TableBody>
                                {invoices.map((invoice) => (
                                    <TableRow 
                                        key={invoice.id}
                                        // Aplicar clase de animación si el ID coincide
                                        className={cn(
                                            highlightedInvoiceId === invoice.id && "animate-row-highlight"
                                        )}
                                    >
                                        <TableCell
                                            className="font-medium truncate max-w-[150px] sm:max-w-[250px] py-2"
                                            title={invoice.filename}
                                        >
                                            {invoice.filename}
                                        </TableCell>
                                        <TableCell className="py-2">
                                            <Badge
                                                variant={getStatusVariant(invoice.status)}
                                                className="whitespace-nowrap capitalize text-xs"
                                            >
                                                {getStatusText(invoice.status)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right text-muted-foreground text-xs whitespace-nowrap py-2">
                                            {formatDistanceToNow(new Date(invoice.created_at), {
                                                addSuffix: true,
                                                locale: es,
                                            })}
                                        </TableCell>
                                        {/* Celda para Acciones */}
                                        <TableCell className="text-right py-1 pr-1 w-[40px]"> {/* Ajustar padding/width */} 
                                             <InvoiceActions 
                                                 invoice={invoice} 
                                                 onViewDetails={() => handleViewDetails(invoice.id)}
                                             />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
