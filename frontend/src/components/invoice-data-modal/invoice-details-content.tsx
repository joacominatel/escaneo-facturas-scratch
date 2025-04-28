import React from 'react';
import type { InvoiceDetail } from "@/lib/api/types";
import { InvoiceItemsTable } from './invoice-items-table';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Usar Card para agrupar
import { Separator } from "@/components/ui/separator";

interface InvoiceDetailsContentProps {
    details: InvoiceDetail;
}

// Helper para formatear datos (puedes moverlos a utils si se usan en más sitios)
const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleDateString('es-AR', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
    } catch { return 'Fecha inválida'; }
};

const formatCurrency = (amount?: number, currency: string = 'ARS') => {
    if (typeof amount !== 'number') return 'N/A';
    try {
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: currency }).format(amount);
    } catch { return `${currency} ${amount.toFixed(2)}`; }
};

export function InvoiceDetailsContent({ details }: InvoiceDetailsContentProps) {
    // Determinar qué datos mostrar: final_data si existe y la factura está procesada, si no preview_data
    const dataToShow = details.status === 'processed' && details.final_data
        ? details.final_data
        : details.preview_data;

    if (!dataToShow) {
        return <p className="text-center text-muted-foreground py-8">No hay datos de previsualización o finales disponibles.</p>;
    }

    // Extraer datos para facilitar lectura
    const { invoice_number, date, bill_to, amount_total, currency = 'ARS', payment_terms, items } = dataToShow;

    return (
        <div className="space-y-4 text-sm">
            {/* Sección Datos Generales */}
            <Card className="bg-muted/30 border-dashed">
                <CardHeader className="pb-2 pt-3">
                    <CardTitle className="text-base">Datos Generales</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-xs pt-0 pb-3">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Nº Factura:</span>
                        <span className="font-medium text-right">{invoice_number || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Fecha:</span>
                        <span className="font-medium text-right">{formatDate(date)}</span>
                    </div>
                    <div className="flex justify-between md:col-span-2">
                        <span className="text-muted-foreground">Proveedor:</span>
                        <span className="font-medium text-right max-w-[70%] truncate" title={bill_to}>{bill_to || 'N/A'}</span>
                    </div>
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">Términos Pago:</span>
                        <span className="font-medium text-right">{payment_terms || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Moneda:</span>
                        <span className="font-medium text-right">{currency}</span>
                    </div>
                    <Separator className="md:col-span-2 my-1" />
                     <div className="flex justify-between font-semibold text-sm md:col-span-2">
                        <span className="text-foreground">Monto Total:</span>
                        <span className="text-right">{formatCurrency(amount_total, currency)}</span>
                    </div>
                </CardContent>
            </Card>

            {/* Sección Ítems */}
            <div>
                <h4 className="text-sm font-medium mb-1">Detalle de Ítems</h4>
                <InvoiceItemsTable items={items} currency={currency} />
            </div>
        </div>
    );
} 