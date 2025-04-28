"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { fetchRecentInvoices } from "@/lib/api/invoices";
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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

    // Estado para WebSocket
    const [isLiveEnabled, setIsLiveEnabled] = useState(false);
    const [isWsConnectedState, setIsWsConnectedState] = useState(isConnected());
    const [isConnectingWs, setIsConnectingWs] = useState(false);

    // Ref para listeners
    const wsListenersRef = useRef<{
        onConnect: () => void;
        onDisconnect: (reason: any, description?: any) => void;
        onConnectError: (error: Error) => void;
        onStatusUpdate: (data: InvoiceStatusUpdateData) => void;
    } | null>(null);

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

    // --- Handlers WebSocket ---
    useEffect(() => {
      wsListenersRef.current = {
          onConnect: () => {
              console.log('RecentInvoices WS Connected!');
              setIsConnectingWs(false);
              setIsWsConnectedState(true);
          },
          onDisconnect: (reason: any, description?: any) => {
              const reasonString = String(reason);
              console.log('RecentInvoices WS Disconnected:', reasonString, description);
              setIsConnectingWs(false);
              setIsWsConnectedState(false);
                // Si la desconexión no fue manual y el usuario quería live
                if (isLiveEnabled && reasonString !== 'io client disconnect') {
                  toast.error("Conexión Live perdida (Dashboard)", { description: `Razón: ${reasonString}` });
                }
          },
          onConnectError: (error: Error) => {
              console.error('RecentInvoices WS Connection Error:', error);
              setIsConnectingWs(false);
              setIsWsConnectedState(false);
              toast.error('Error de conexión Live (Dashboard)', { description: error.message });
              setIsLiveEnabled(false); // Desactivar si falla
          },
          onStatusUpdate: (update: InvoiceStatusUpdateData) => {
              console.log('RecentInvoices WS Update:', update);
              setInvoices(currentInvoices => {
                  const index = currentInvoices.findIndex(inv => inv.id === update.id);
                  if (index !== -1) {
                      toast.info(`Factura ${update.filename} actualizada a ${update.status}`, {
                          description: "Estado actualizado en lista reciente."
                      });
                      const newInvoices = [...currentInvoices];
                      newInvoices[index] = { ...newInvoices[index], status: update.status as InvoiceStatus };
                      return newInvoices;
                  } else {
                     // Para recientes, podríamos querer recargar para ver si entra en la lista
                     // loadRecentInvoices(); // Opcional
                  }
                  return currentInvoices;
              });
          }
      };
    }, [isLiveEnabled]); // Depende de isLiveEnabled para la lógica de error

    // Función para alternar conexión
    const toggleLive = useCallback(() => {
        setIsLiveEnabled(prevIsLive => {
           const nextIsLive = !prevIsLive;
           if (!nextIsLive) {
                // --- Desconectar --- 
                console.log("[RecentInvoices] Desactivando Live...");
                if (wsListenersRef.current) {
                  removeConnectListener(wsListenersRef.current.onConnect);
                  removeDisconnectListener(wsListenersRef.current.onDisconnect);
                  removeConnectErrorListener(wsListenersRef.current.onConnectError);
                  removeStatusUpdateListener(wsListenersRef.current.onStatusUpdate);
                }
                disconnect();
                setIsConnectingWs(false);
                setIsWsConnectedState(false);
           } else {
               // --- Conectar --- 
               console.log("[RecentInvoices] Activando Live...");
               setIsConnectingWs(true);
               if (wsListenersRef.current) {
                  addConnectListener(wsListenersRef.current.onConnect);
                  addDisconnectListener(wsListenersRef.current.onDisconnect);
                  addConnectErrorListener(wsListenersRef.current.onConnectError);
                  addStatusUpdateListener(wsListenersRef.current.onStatusUpdate);
               } else {
                  console.error("[RecentInvoices] wsListenersRef no inicializado al intentar conectar.");
                  setIsConnectingWs(false);
                  return false; // No cambiar estado
               }
           }
            return nextIsLive;
        });
    }, []); // Sin deps externas gracias a ref

    // Efecto para sincronizar el estado real del socket
    useEffect(() => {
        setIsWsConnectedState(isConnected()); // Estado inicial
        const interval = setInterval(() => {
          const currentWsState = isConnected();
          setIsWsConnectedState(prevState => {
              if (prevState !== currentWsState) {
                  console.log(`[RecentInvoices] Sincronizando estado WS: ${prevState} -> ${currentWsState}`);
                  if (!currentWsState && isLiveEnabled) {
                     setIsLiveEnabled(false); // Desactivar si cae la conexión
                  }
              }
              return currentWsState;
          });
        }, 3000);
        return () => {
           clearInterval(interval);
            // Limpiar listeners al desmontar si estaba activo
            if (isLiveEnabled && wsListenersRef.current) {
                 console.log("[RecentInvoices] Desmontando: Removiendo listeners WS...");
                 removeConnectListener(wsListenersRef.current.onConnect);
                 removeDisconnectListener(wsListenersRef.current.onDisconnect);
                 removeConnectErrorListener(wsListenersRef.current.onConnectError);
                 removeStatusUpdateListener(wsListenersRef.current.onStatusUpdate);
                 // No desconectar globalmente desde aquí probablemente
            }
        }
    }, [isLiveEnabled]); // Depende de isLiveEnabled

    // --- Renderizado --- (Adaptado para usar los nuevos estados)
    const renderConnectionStatus = () => {
        let color = "bg-gray-400";
        let title = "Live Desconectado";
        if (isConnectingWs) {
            color = "bg-yellow-400 animate-pulse";
            title = "Conectando Live...";
        } else if (isWsConnectedState) {
            color = "bg-green-500";
            title = "Live Conectado";
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
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="live-updates-dashboard"
                                checked={isLiveEnabled}
                                onCheckedChange={toggleLive}
                                disabled={isConnectingWs}
                                aria-label="Activar/desactivar actualizaciones en tiempo real"
                            />
                            <Label
                                htmlFor="live-updates-dashboard"
                                className={cn(
                                    "text-sm font-medium cursor-pointer",
                                    isConnectingWs && "text-muted-foreground cursor-not-allowed"
                                )}
                            >
                                Live
                            </Label>
                        </div>
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
