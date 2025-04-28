import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, PlusCircle } from "lucide-react";
import type { ProcessedInvoiceItem } from "@/lib/api/types";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge'; // Asegúrate que la importación sea correcta

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

    // Sincronizar estado local si los items externos cambian
    useEffect(() => {
        setLocalItems(items);
    }, [items]);

    const handleInputChange = (index: number, field: keyof ProcessedInvoiceItem, value: string | string[]) => {
        const newItems = [...localItems];
        const item = newItems[index];

        if (field === 'amount') {
             const numericValue = parseCurrencyInput(value as string);
             // Permitimos que sea null temporalmente mientras se escribe, pero guardamos como número
             (item as any)[field] = numericValue; // Almacenamos el número parseado o null
        } else if (field === 'advertising_numbers') {
            // Asumimos que el valor viene de un input simple por ahora, separado por comas
            const nums = typeof value === 'string' ? value.split(',').map(s => s.trim()).filter(Boolean) : [];
             (item as any)[field] = nums;
        } else {
            (item as any)[field] = value;
        }

        setLocalItems(newItems);
        onItemsChange(newItems); // Notificar al padre sobre el cambio
    };

     const handleAmountBlur = (index: number) => {
        // Al salir del campo de monto, asegurar que se guarde un número válido o 0 si está vacío/inválido
        const newItems = [...localItems];
        const item = newItems[index];
        if (item.amount === null || isNaN(item.amount)) {
             item.amount = 0; // O decidir si mantener null es válido para el backend
        }
        setLocalItems(newItems);
        onItemsChange(newItems);
     };

    const handleAddItem = () => {
        const newItem: ProcessedInvoiceItem = {
            description: '',
            amount: 0, // Iniciar con 0
            advertising_numbers: []
        };
        const newItems = [...localItems, newItem];
        setLocalItems(newItems);
        onItemsChange(newItems);
    };

    const handleRemoveItem = (index: number) => {
        const newItems = localItems.filter((_, i) => i !== index);
        setLocalItems(newItems);
        onItemsChange(newItems);
    };

    // Compara el item actual con el original en la misma posición (si existe)
    const isItemModified = (item: ProcessedInvoiceItem, index: number): boolean => {
         if (index >= originalItems.length) return true; // Item nuevo es modificado
         return JSON.stringify(item) !== JSON.stringify(originalItems[index]);
    };

    return (
        <div className={cn("relative w-full", className)}>
             <ScrollArea className="rounded-md border mt-4 w-full">
                <Table className="min-w-full w-max">
                    <TableHeader className="bg-muted/50 sticky top-0 z-10">
                        <TableRow>
                            <TableHead className="w-[55%] min-w-[250px]">Descripción</TableHead>
                            <TableHead>Números OP (separados por coma)</TableHead>
                            <TableHead className="text-right min-w-[120px]">Monto</TableHead>
                            <TableHead className="w-[50px]"></TableHead> {/* Columna para botón borrar */}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {localItems.map((item, index) => {
                            const modified = isItemModified(item, index);
                            // Eliminamos espacios/saltos de línea antes del TableRow para evitar warning de hidratación
                            return (
                                <TableRow key={index} className={cn(modified && "bg-yellow-50")}>
                                    <TableCell className="font-medium align-top py-1 pr-1">
                                        <Input
                                            value={item.description || ""}
                                            onChange={(e) => handleInputChange(index, 'description', e.target.value)}
                                            className="h-8 text-sm"
                                            placeholder="Descripción del ítem"
                                        />
                                    </TableCell>
                                    <TableCell className="align-top py-1 pr-1">
                                        <Input
                                            value={item.advertising_numbers.join(', ')}
                                            onChange={(e) => handleInputChange(index, 'advertising_numbers', e.target.value)}
                                            className="h-8 text-sm font-mono"
                                            placeholder="OP1, OP2, ..."
                                        />
                                         {/* Opcional: mostrar badges debajo o al lado */}
                                         {item.advertising_numbers.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {item.advertising_numbers.map(num => (
                                                    <Badge key={num} variant="secondary" className="text-xs font-mono">{num}</Badge>
                                                ))}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="align-top py-1 text-right">
                                        <Input
                                            type="text" // Usar text para permitir comas y formateo manual si es necesario
                                            value={item.amount === null ? '' : String(item.amount).replace('.', ',')}
                                            onChange={(e) => handleInputChange(index, 'amount', e.target.value)}
                                            onBlur={() => handleAmountBlur(index)} // Validar/formatear al salir
                                            className="h-8 text-sm text-right font-mono"
                                            placeholder="0,00"
                                        />
                                        {/* Mostrar valor formateado (solo si no está vacío/null) */}
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