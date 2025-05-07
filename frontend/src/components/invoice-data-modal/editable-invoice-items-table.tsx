/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, PlusCircle } from "lucide-react";
import type { ProcessedInvoiceItem } from "@/lib/api/types";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from '@/lib/utils';

interface EditableInvoiceItemsTableProps {
    items: ProcessedInvoiceItem[];
    onItemsChange: (items: ProcessedInvoiceItem[]) => void;
    currency?: string;
    className?: string;
    originalItems: ProcessedInvoiceItem[]; // Para comparar y resaltar cambios
}

// Helper para formatear moneda (igual que en InvoiceItemsTable)
const formatCurrency = (amount: number | string | null | undefined, currency: string = 'ARS'): string => {
    const numericAmount = typeof amount === 'string' ? parseFloat(amount.replace(',', '.')) : amount; // Intenta convertir string a número
    if (numericAmount === null || numericAmount === undefined || isNaN(numericAmount)) {
        return '-'; // O un valor por defecto apropiado
    }
    try {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(numericAmount);
    } catch (error) {
        console.warn("Error formatting currency:", error);
        return `${currency} ${numericAmount.toFixed(2)}`; // Fallback
    }
};

// Helper para parsear valor de input de moneda
const parseCurrencyInput = (value: string): number | null => {
    // Remover caracteres no numéricos excepto coma y punto
    const cleanedValue = value.replace(/[^0-9,.]/g, '');
    // Reemplazar coma por punto para el parseo
    const numericString = cleanedValue.replace(',', '.');
    const parsed = parseFloat(numericString);
    return isNaN(parsed) ? null : parsed;
};


export function EditableInvoiceItemsTable({
    items,
    onItemsChange,
    currency,
    className,
    originalItems
}: EditableInvoiceItemsTableProps) {
    const [localItems, setLocalItems] = useState<ProcessedInvoiceItem[]>(items);

    useEffect(() => {
        setLocalItems(items);
    }, [items]);

    const handleItemFieldChange = (index: number, field: keyof ProcessedInvoiceItem, value: string) => {
        const newItems = [...localItems];
        if (field === 'amount') {
            (newItems[index] as any)[field] = parseCurrencyInput(value);
        } else {
            (newItems[index] as any)[field] = value;
        }
        setLocalItems(newItems);
        onItemsChange(newItems);
    };

    const handleAmountBlur = (index: number) => {
        const newItems = [...localItems];
        const item = newItems[index];
        if (item.amount === null || isNaN(item.amount)) {
            item.amount = 0;
        }
        setLocalItems(newItems);
        onItemsChange(newItems);
    };

    const handleAddItem = () => {
        const newItem: ProcessedInvoiceItem = { description: '', amount: 0 };
        const newItems = [...localItems, newItem];
        setLocalItems(newItems);
        onItemsChange(newItems);
    };

    const handleRemoveItem = (index: number) => {
        const newItems = localItems.filter((_, i) => i !== index);
        // Reajustar índices mayores que el eliminado? No, React keys lo manejan.
        setLocalItems(newItems);
        onItemsChange(newItems);
    };

    const isItemModified = (item: ProcessedInvoiceItem, index: number): boolean => {
        if (index >= originalItems.length) return true;
        return JSON.stringify(item) !== JSON.stringify(originalItems[index]);
    };

    return (
        <div className={cn("relative w-full", className)}>
            <ScrollArea className="rounded-md border mt-4 w-full">
                <Table className="min-w-full w-max">
                    <TableHeader className="bg-muted/50 sticky top-0 z-10">
                        <TableRow>
                            <TableHead className="w-[50%] min-w-[200px]">Descripción</TableHead>
                            <TableHead className="text-right min-w-[120px]">Monto</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {localItems.map((item, index) => {
                            const modified = isItemModified(item, index);
                            const displayAmount = item.amount === null ? '' : String(item.amount).replace('.', ',');

                            return (
                                <TableRow key={index} className={cn(modified && "bg-yellow-50")}>
                                    <TableCell className="font-medium align-top py-1 pr-1">
                                        <Input
                                            value={item.description || ""}
                                            onChange={(e) => handleItemFieldChange(index, 'description', e.target.value)}
                                            className="h-8 text-sm"
                                            placeholder="Descripción del ítem"
                                        />
                                    </TableCell>
                                    <TableCell className="align-top py-1 text-right">
                                        <Input
                                            type="text"
                                            value={displayAmount}
                                            onChange={(e) => handleItemFieldChange(index, 'amount', e.target.value)}
                                            onBlur={() => handleAmountBlur(index)}
                                            className="h-8 text-sm text-right font-mono"
                                            placeholder="0,00"
                                        />
                                        {item.amount !== null && (
                                            <span className="text-xs text-muted-foreground ml-1">
                                                ({formatCurrency(item.amount, currency)})
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className="align-middle py-1 text-center">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-destructive hover:text-destructive"
                                            onClick={() => handleRemoveItem(index)}
                                            aria-label="Eliminar ítem"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
            <Button variant="outline" size="sm" onClick={handleAddItem} className="mt-2">
                 <PlusCircle className="h-4 w-4 mr-2" />
                Añadir Ítem
            </Button>
        </div>
    );
} 