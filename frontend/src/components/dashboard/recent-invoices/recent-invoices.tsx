"use client";

import React, { useState, useEffect, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { fetchRecentInvoices } from "@/lib/api/invoices"; // Importar directamente
import {
  connectToInvoiceUpdates,
  disconnectFromInvoiceUpdates,
  isInvoiceSocketConnected,
} from "@/lib/ws/invoice-updates"; // Importar funciones WS
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
  const [isWsConnected, setIsWsConnected] = useState(isInvoiceSocketConnected()); // Inicializar con estado actual
  const [isConnectingWs, setIsConnectingWs] = useState(false);

  // Fetch inicial de datos
  const loadRecentInvoices = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedInvoices = await fetchRecentInvoices(5); // Limite de 5
      setInvoices(fetchedInvoices);
    } catch (err) {
      console.error("Error fetching recent invoices:", err);
      setError(err instanceof Error ? err : new Error("Failed to load invoices"));
      setInvoices([]); // Limpiar en caso de error
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecentInvoices();
  }, [loadRecentInvoices]);

  // --- Handlers WebSocket --- (Similares a InvoiceTable)
  const handleWsConnect = useCallback(() => {
    console.log('RecentInvoices WS Connected!');
    setIsConnectingWs(false);
    setIsWsConnected(true);
    // No mostrar toast aquí para no duplicar si ya está conectado desde History
  }, []);

  const handleWsDisconnect = useCallback((reason: unknown) => {
    const reasonString = String(reason);
    console.log('RecentInvoices WS Disconnected:', reasonString);
    setIsConnectingWs(false);
    setIsWsConnected(false);
    // No mostrar toast aquí tampoco
  }, []);

  const handleWsConnectError = useCallback((error: Error) => {
    console.error('RecentInvoices WS Connection Error:', error);
    setIsConnectingWs(false);
    setIsWsConnected(false);
    toast.error('Error de conexión Live (Dashboard)', { description: error.message });
  }, []);

  const handleWsStatusUpdate = useCallback((update: { id: number; status: string; filename: string }) => {
    console.log('RecentInvoices WS Update:', update);
    setInvoices(currentInvoices => {
      const index = currentInvoices.findIndex(inv => inv.id === update.id);
      // Si la factura actualizada está en nuestra lista, actualízala
      if (index !== -1) {
        toast.info(`Factura ${update.filename} actualizada a ${update.status}`, {
           description: "Estado actualizado en lista reciente."
        });
        const newInvoices = [...currentInvoices];
        newInvoices[index] = { ...newInvoices[index], status: update.status as InvoiceStatus };
        return newInvoices;
      } else {
         // Opcional: Si quieres añadir la nueva factura si no está (podría desordenar)
         // loadRecentInvoices(); // O simplemente refetch para obtener el orden correcto
      }
      return currentInvoices; // Si no está, no hacer nada
    });
  }, []);

  // Función para alternar conexión
  const toggleLive = useCallback(() => {
    if (isWsConnected) {
      disconnectFromInvoiceUpdates();
      // Los handlers ya actualizan el estado isWsConnected
    } else {
      setIsConnectingWs(true);
      connectToInvoiceUpdates({
        onConnect: handleWsConnect,
        onDisconnect: handleWsDisconnect,
        onConnectError: handleWsConnectError,
        onStatusUpdate: handleWsStatusUpdate,
      });
    }
  }, [isWsConnected, handleWsConnect, handleWsDisconnect, handleWsConnectError, handleWsStatusUpdate]);

  // Efecto para sincronizar el estado si la conexión cambia desde otro lugar
  useEffect(() => {
    const checkConnection = () => setIsWsConnected(isInvoiceSocketConnected());
    // Verificar al montar y suscribirse a eventos globales si fueran necesarios
    checkConnection();
    // Podríamos necesitar un listener global si la conexión se maneja centralmente
    // window.addEventListener('ws-connection-change', checkConnection);
    // return () => window.removeEventListener('ws-connection-change', checkConnection);

    // Alternativa simple: verificar periódicamente (menos ideal)
    const interval = setInterval(checkConnection, 3000); // Verificar cada 3s
    return () => clearInterval(interval);

  }, []);

  // Cleanup WebSocket on component unmount
  // useEffect(() => {
  //   // Decidir si este componente debe desconectar al desmontarse
  //   // o si la conexión debe persistir mientras la app esté abierta.
  //   // Por ahora, lo dejamos conectado si se activó.
  //   // return () => {
  //   //   if (isInvoiceSocketConnected()) {
  //   //     // disconnectFromInvoiceUpdates(); // Descomentar si quieres desconectar al salir del dashboard
  //   //   }
  //   // };
  // }, []);

  // --- Renderizado --- (Adaptado para usar los nuevos estados)
  const renderConnectionStatus = () => {
    let color = "bg-gray-400";
    let title = "Live Desconectado";
    if (isConnectingWs) {
      color = "bg-yellow-400 animate-pulse";
      title = "Conectando Live...";
    } else if (isWsConnected) {
      color = "bg-green-500";
      title = "Live Conectado";
    }
    // Podríamos añadir un estado de error si handleWsConnectError lo setea

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
                checked={isWsConnected} // Controlado por el estado real del socket
                onCheckedChange={toggleLive} // Llama a la nueva función toggle
                disabled={isConnectingWs} // Deshabilitar mientras conecta
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
                <Skeleton key={i} className="h-10 w-full rounded-md" /> // Mejorar skeleton
              ))}
            </div>
          )}
          {!isLoading && error && (
            <div className="text-red-600 dark:text-red-400 mt-4 text-center py-6">
              <p>Error al cargar facturas.</p>
              {/* <p className="text-sm">{error.message}</p> */}
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
                      className="font-medium truncate max-w-[150px] sm:max-w-[250px] py-2" // Ajustar padding
                      title={invoice.filename}
                    >
                      {invoice.filename}
                    </TableCell>
                    <TableCell className="py-2">
                      <Badge
                        variant={getStatusVariant(invoice.status)}
                        className="whitespace-nowrap capitalize text-xs" // Hacer texto más pequeño y capitalizar
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
