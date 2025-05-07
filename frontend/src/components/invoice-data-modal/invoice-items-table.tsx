import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { ProcessedInvoiceItem } from "@/lib/api/types"; // Usar el tipo específico si es posible
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from '@/lib/utils';

interface InvoiceItemsTableProps {
    items?: ProcessedInvoiceItem[];
    currency?: string; // Para formatear la moneda
    className?: string;
}

// Helper para formatear moneda
const formatCurrency = (amount: number, currency: string = 'ARS') => {
    try {
        return new Intl.NumberFormat('es-AR', { // Usar locale adecuado
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    } catch (error) {
        console.warn("Error formatting currency:", error);
        return `${currency} ${amount.toFixed(2)}`; // Fallback
    }
};

export function InvoiceItemsTable({ items, currency, className }: InvoiceItemsTableProps) {
    if (!items || items.length === 0) {
        return <p className="text-sm text-muted-foreground mt-4">No hay ítems detallados en esta factura.</p>;
    }

    return (
        <ScrollArea className={cn("rounded-md border mt-4 relative w-full", className)}>
             <Table className="min-w-full w-max">
                <TableHeader className="bg-muted/50 sticky top-0 z-10">
                    <TableRow>
                        <TableHead className="w-[60%] min-w-[250px]">Descripción</TableHead>
                        <TableHead className="text-right min-w-[120px]">Monto</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {items.map((item, index) => (
                        <TableRow key={index}>
                            <TableCell className="font-medium align-top py-2 pr-1">
                                {item.description || "-"}
                            </TableCell>
                            <TableCell className="text-right align-top py-2 pr-1">
                                {formatCurrency(item.amount, currency)}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            <ScrollBar orientation="horizontal" />
        </ScrollArea>
    );
} 