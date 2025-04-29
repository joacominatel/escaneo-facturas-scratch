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

    // --- Estado WebSocket desde el Contexto ---
    const { 
        isConnected: isWsConnectedState, 
        connectError: wsConnectError, 
        addStatusUpdateListener, // Obtener funciones del contexto
        removeStatusUpdateListener 
    } = useWebSocket();

    // Fetch inicial de datos
    const loadRecentInvoices = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const fetchedInvoices = await fetchRecentInvoices(5);
            setInvoices(fetchedInvoices);
        } catch (err) {
            console.error("Error fetching recent invoices:", err);
            setError(err instanceof Error ? err : new Error("Failed to load invoices"));
            setInvoices([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadRecentInvoices();
    }, [loadRecentInvoices]);

    // --- Handler para Actualizaciones de Estado WS --- 
    // Usamos useCallback para memoizar la función del listener
    const handleStatusUpdate = useCallback((update: InvoiceStatusUpdateData) => {
        console.log('RecentInvoices WS Update:', update);
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
                 // Si no está en la lista reciente, podríamos considerar recargar
                 // loadRecentInvoices(); // Opcional, puede ser mucho si hay muchos updates
            }
            return currentInvoices;
        });
    }, []); // Sin dependencias externas

    // --- Efecto para suscribirse/desuscribirse a los updates --- 
    useEffect(() => {
        console.log("[RecentInvoices] Efecto: Añadiendo listener de status.");
        addStatusUpdateListener(handleStatusUpdate);

        // Limpieza: eliminar el listener cuando el componente se desmonte
        return () => {
            console.log("[RecentInvoices] Limpieza Efecto: Eliminando listener de status.");
            removeStatusUpdateListener(handleStatusUpdate);
        };
    }, [addStatusUpdateListener, removeStatusUpdateListener, handleStatusUpdate]); // Dependencias correctas

    // --- Efecto para mostrar errores de conexión WS (del contexto) ---
    useEffect(() => {
        if (wsConnectError) {
            toast.error('Error de Conexión Live (Dashboard)', { description: wsConnectError.message });
        }
    }, [wsConnectError]);

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
                        <CardDescription>Últimas 5 facturas recibidas.</CardDescription>
                    </div>
                    <div className="flex items-center space-x-4">
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
                                    <TableRow key={invoice.id}>
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
