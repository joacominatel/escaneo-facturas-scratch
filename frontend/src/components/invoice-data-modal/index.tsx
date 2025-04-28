import React, { useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton"; // Para el estado de carga
import { AlertTriangle } from "lucide-react"; // Para errores
import { useInvoiceDetails } from "@/hooks/use-invoice-details";
import { InvoiceDetailsContent } from "./invoice-details-content";
import { AdvertisingNumbersDisplay } from "./advertising-numbers-display";
import { Badge } from "@/components/ui/badge"; // Para estado y OPs
import { statusColorMap } from "@/components/invoice-history/invoice-table/constants"; // Reutilizar colores
import type { InvoiceStatus } from "@/lib/api/types";

interface InvoiceDataModalProps {
    invoiceId: number | null;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    trigger?: React.ReactNode; // Trigger opcional si no se controla externamente
}

export function InvoiceDataModal({ invoiceId, isOpen, onOpenChange, trigger }: InvoiceDataModalProps) {
    const {
        details,
        isLoading,
        error,
        fetchDetails,
        resetDetails
    } = useInvoiceDetails();

    // Fetch data when the dialog opens with a valid ID
    useEffect(() => {
        if (isOpen && invoiceId) {
            fetchDetails(invoiceId);
        } else if (!isOpen) {
            // Reset state when closing
            resetDetails();
        }
    }, [isOpen, invoiceId, fetchDetails, resetDetails]);

    // Determinar los datos e ítems a mostrar para los OPs en el header
    const dataForHeader = details
        ? (details.status === 'processed' && details.final_data ? details.final_data : details.preview)
        : null;

    // Determinar el estado a mostrar en el header
    const statusToShow = details?.status;
    const statusColorClass = statusToShow
        ? statusColorMap[statusToShow as InvoiceStatus] || statusColorMap.duplicated
        : 'bg-gray-100 text-gray-800'; // Color por defecto mientras carga o si no hay status

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            {trigger && trigger} {/* Renderizar trigger si se proporciona */}
            <DialogContent className="sm:max-w-[80%] md:max-w-[70%] lg:max-w-[60%] xl:max-w-[50%] max-h-[90vh] flex flex-col">
                <DialogHeader className="pr-6 pb-2 border-b">
                    <div className="flex justify-between items-start gap-4">
                        <DialogTitle className="text-lg">Detalles de Factura (ID: {invoiceId ?? '...'})</DialogTitle>
                        {/* Mostrar badge de estado solo si hay status */}
                        {statusToShow && (
                             <Badge variant="outline" className={`border-none capitalize text-xs whitespace-nowrap ${statusColorClass}`}>
                                 {statusToShow.replace('_', ' ')}
                             </Badge>
                        )}
                    </div>
                    {/* Mostrar OPs en el header si hay datos (y no está cargando) */}
                    {!isLoading && dataForHeader?.items && (
                        <AdvertisingNumbersDisplay items={dataForHeader.items} className="mt-1" />
                    )}
                    {/* <DialogDescription>Visualiza los datos extraídos de la factura.</DialogDescription> */}
                </DialogHeader>

                {/* Contenido principal con scroll */} 
                <div className="flex-grow overflow-y-auto px-6 py-4 -mx-6 custom-scrollbar">
                    {isLoading && (
                        <div className="space-y-4 py-8">
                            <Skeleton className="h-8 w-1/3" />
                            <Skeleton className="h-24 w-full" />
                            <Skeleton className="h-8 w-1/4 mt-4" />
                            <Skeleton className="h-40 w-full" />
                        </div>
                    )}
                    {!isLoading && error && (
                        <div className="flex flex-col items-center justify-center text-destructive text-center py-10">
                             <AlertTriangle className="w-10 h-10 mb-3" />
                            <p className="font-semibold mb-1">Error al cargar detalles</p>
                            <p className="text-sm">{error}</p>
                        </div>
                    )}
                    {!isLoading && !error && details && (
                        <InvoiceDetailsContent details={details} />
                    )}
                    {!isLoading && !error && !details && (
                         <p className="text-center text-muted-foreground py-10">No se han cargado detalles.</p>
                     )}
                </div>
            </DialogContent>
        </Dialog>
    );
}