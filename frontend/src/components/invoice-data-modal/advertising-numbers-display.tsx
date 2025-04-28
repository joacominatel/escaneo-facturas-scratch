import React from 'react';
import { Badge } from "@/components/ui/badge";
import type { ProcessedInvoiceItem } from "@/lib/api/types"; // Asumiendo que los items tienen esta estructura

interface AdvertisingNumbersDisplayProps {
    items?: ProcessedInvoiceItem[];
    className?: string;
}

export function AdvertisingNumbersDisplay({ items, className }: AdvertisingNumbersDisplayProps) {
    if (!items || items.length === 0) {
        return null;
    }

    // Extraer todos los números, aplanar el array, filtrar vacíos y obtener únicos
    const uniqueNumbers = Array.from(
        new Set(
            items
                .flatMap(item => item.advertising_numbers || []) // Obtener todos los arrays de números
                .filter(num => num && num.trim() !== '') // Filtrar nulos o vacíos
        )
    );

    if (uniqueNumbers.length === 0) {
        return null;
    }

    return (
        <div className={`flex flex-wrap gap-1 items-center ${className}`}>
            <span className="text-xs font-medium text-muted-foreground mr-1">Números OP:</span>
            {uniqueNumbers.map((num) => (
                <Badge key={num} variant="secondary" className="bg-teal-100 text-teal-800 hover:bg-teal-200 border-none text-xs">
                    {num}
                </Badge>
            ))}
        </div>
    );
} 