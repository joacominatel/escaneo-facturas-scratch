import React from 'react';
import { ColumnDef, Column, CellContext } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import { InvoiceListItem, InvoiceStatus } from "@/lib/api/types";
import { InvoiceActions } from "@/components/invoice-history/invoice-actions";
import { statusColorMap } from "./constants";

type InvoiceCellContext = CellContext<InvoiceListItem, unknown>;

// Definición de las columnas para la tabla de facturas
export const getInvoiceTableColumns = (
    onViewDetails: (invoiceId: number) => void // Callback para abrir modal
): ColumnDef<InvoiceListItem>[] => [
    {
        id: "select",
        header: ({ table }) => (
            <Checkbox
                checked={
                    table.getIsAllPageRowsSelected() ||
                    (table.getIsSomePageRowsSelected() && "indeterminate")
                }
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Seleccionar todas las filas de la página actual"
                className="translate-y-[2px]"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Seleccionar fila"
                className="translate-y-[2px]"
            />
        ),
        enableSorting: false,
        enableHiding: false,
        size: 40,
    },
    {
        accessorKey: "filename",
        header: ({ column }: { column: Column<InvoiceListItem, unknown> }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
                Nombre Archivo
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }: InvoiceCellContext) => <div className="font-medium truncate" title={row.getValue("filename")}>{row.getValue("filename")}</div>,
        size: 300,
    },
    {
        accessorKey: "status",
        header: "Estado",
        cell: ({ row }: InvoiceCellContext) => {
            const status = row.getValue("status") as InvoiceStatus;
            const colorClass = statusColorMap[status] || statusColorMap.duplicated;
            return (
                <Badge variant="outline" className={`border-none capitalize text-xs ${colorClass}`}>
                    {status.replace('_', ' ')}
                </Badge>
            );
        },
        size: 150,
    },
    {
        accessorKey: "created_at",
        header: ({ column }: { column: Column<InvoiceListItem, unknown> }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
                Fecha Creación
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }: InvoiceCellContext) => {
            try {
                const date = new Date(row.getValue("created_at"));
                return <div suppressHydrationWarning>{date.toLocaleString()}</div>;
            } catch (e) {
                console.error("Error al formatear la fecha:", e);
                return <div>Fecha inválida</div>;
            }
        },
        size: 200,
    },
    {
        accessorKey: "company_name",
        header: "Compañía",
        cell: ({ row }: InvoiceCellContext) => <div className="font-medium truncate" title={row.getValue("company_name")}>{row.getValue("company_name")}</div>,
        size: 200,
    },
    {
        id: "actions",
        header: () => <div className="text-right pr-4">Acciones</div>,
        cell: ({ row }: InvoiceCellContext) => (
            <div className="text-right">
                <InvoiceActions
                    invoice={row.original}
                    onViewDetails={() => onViewDetails(row.original.id)}
                />
            </div>
        ),
        size: 50,
    },
]; 