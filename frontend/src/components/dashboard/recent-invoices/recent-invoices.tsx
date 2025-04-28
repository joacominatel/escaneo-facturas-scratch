"use client";

import React from "react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale"; // Import Spanish locale
import { useRecentInvoices } from "@/hooks/use-recent-invoices";
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
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import type { InvoiceStatus } from "@/lib/api/types";
import { cn } from "@/lib/utils";

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
  const { invoices, isLoading, error, isLive, wsStatus, toggleLive } =
    useRecentInvoices({ limit: 5 });

  const renderConnectionStatus = () => {
    let color = "bg-gray-400"; // Default/Disconnected
    let title = "Desconectado";
    if (wsStatus === "connecting") {
      color = "bg-yellow-400 animate-pulse";
      title = "Conectando...";
    } else if (wsStatus === "connected") {
      color = "bg-green-500";
      title = "Conectado (Live)";
    } else if (wsStatus === "error") {
      color = "bg-red-500";
      title = "Error de conexión";
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
        <CardHeader className="flex-1 w-full md:w-1/2 items-center justify-between space-y-0 pb-2">
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
                id="live-updates"
                checked={isLive}
                onCheckedChange={toggleLive}
                aria-label="Activar/desactivar actualizaciones en tiempo real"
              />
              <Label
                htmlFor="live-updates"
                className="text-sm font-medium cursor-pointer"
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
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          )}
          {!isLoading && error && (
            <div className="text-red-600 dark:text-red-400 mt-4 text-center">
              <p>Error al cargar facturas:</p>
              <p className="text-sm">{error.message}</p>
            </div>
          )}
          {!isLoading && !error && invoices.length === 0 && (
            <p className="text-muted-foreground mt-4 text-center">
              No hay facturas recientes.
            </p>
          )}
          {!isLoading && !error && invoices.length > 0 && (
            <Table>
              {/* <TableHeader> // Optional: Add header if needed
              <TableRow>
                <TableHead>Archivo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Recibido</TableHead>
              </TableRow>
            </TableHeader> */}
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell
                      className="font-medium truncate max-w-[150px] sm:max-w-[250px]"
                      title={invoice.filename}
                    >
                      {invoice.filename}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={getStatusVariant(invoice.status)}
                        className="whitespace-nowrap"
                      >
                        {getStatusText(invoice.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground text-sm whitespace-nowrap">
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
