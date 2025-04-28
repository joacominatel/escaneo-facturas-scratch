import React, { useEffect, useState, useCallback } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Edit, Check } from "lucide-react";
import { useInvoiceDetails } from "@/hooks/use-invoice-details";
import { useInvoicePreviewEdit } from '@/hooks/use-invoice-preview-edit';
import { InvoiceDetailsContent } from "./invoice-details-content";
import { AdvertisingNumbersDisplay } from "./advertising-numbers-display";
import { InvoiceItemsTable } from './invoice-items-table';
import { EditableInvoiceItemsTable } from './editable-invoice-items-table';
import { EditActionBar } from './edit-action-bar';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { statusColorMap } from "@/components/invoice-history/invoice-table/constants";
import type { InvoiceStatus, ProcessedInvoiceItem } from "@/lib/api/types";
import { toast } from "sonner";

interface InvoiceDataModalProps {
    invoiceId: number | null;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    trigger?: React.ReactNode;
    onEditSuccess?: () => void;
}

export function InvoiceDataModal({ invoiceId, isOpen, onOpenChange, trigger, onEditSuccess }: InvoiceDataModalProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    const {
        details,
        isLoading: isLoadingDetails,
        error: detailsError,
        fetchDetails,
        resetDetails
    } = useInvoiceDetails();

    const initialDataForEdit = details?.preview || null;

    const {
        previewData: editedPreviewData,
        setPreviewData: setEditedPreviewData,
        saveChanges,
        isSaving,
        isModified,
        error: editError,
        lastSavedData
    } = useInvoicePreviewEdit({
        invoiceId: invoiceId,
        initialPreviewData: initialDataForEdit,
    });

    useEffect(() => {
        if (isOpen && invoiceId) {
            setIsEditing(false);
            fetchDetails(invoiceId);
        } else if (!isOpen) {
            resetDetails();
            setIsEditing(false);
        }
    }, [isOpen, invoiceId, fetchDetails, resetDetails]);

    const displayData = isEditing ? editedPreviewData : (details?.status === 'processed' && details.final_data ? details.final_data : details?.preview);
    const displayItems = displayData?.items as ProcessedInvoiceItem[] | undefined ?? [];

    const originalItemsForEdit = (lastSavedData?.items || initialDataForEdit?.items || []) as ProcessedInvoiceItem[];

    const statusToShow = details?.status;
    const canEdit = statusToShow === 'waiting_validation';
    const statusColorClass = statusToShow
        ? statusColorMap[statusToShow as InvoiceStatus] || statusColorMap.duplicated
        : 'bg-gray-100 text-gray-800';

    const handleEditClick = () => {
        if (canEdit && initialDataForEdit) {
            setIsEditing(true);
            setEditedPreviewData(initialDataForEdit);
        }
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditedPreviewData(lastSavedData || initialDataForEdit);
    };

    const handleConfirmSave = () => {
        setShowConfirmDialog(true);
    };

    const proceedWithSave = async () => {
        setShowConfirmDialog(false);
        try {
            await saveChanges();
            setIsEditing(false);
            toast.success("Datos de previsualización actualizados correctamente.");
            if (invoiceId) {
                fetchDetails(invoiceId);
            }
            if (onEditSuccess) {
                onEditSuccess();
            }
        } catch (err) {
            console.error("Error en saveChanges capturado en modal:", err);
            toast.error("Error al guardar los cambios. Revisa los detalles del error.");
        }
    };

    const handleItemsChange = useCallback((newItems: ProcessedInvoiceItem[]) => {
        setEditedPreviewData(prev => ({ ...prev, items: newItems }));
    }, [setEditedPreviewData]);

    const isLoading = isLoadingDetails;
    const error = detailsError || editError;

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onOpenChange}>
                {trigger && !isOpen && trigger}
                <DialogContent className="sm:max-w-[80%] md:max-w-[70%] lg:max-w-[70%] xl:max-w-[60%] max-h-[90vh] flex flex-col pb-0">
                    <DialogHeader className="pr-6 pt-6 pb-3 border-b sticky top-0 bg-background z-10">
                        <div className="flex justify-between items-start gap-4">
                            <DialogTitle className="text-lg">
                                Detalles de Factura (ID: {invoiceId ?? '...'}) {isEditing && <span className="text-orange-500 font-normal text-base">(Editando)</span>}
                            </DialogTitle>
                            {statusToShow && (
                                <Badge variant="outline" className={`border-none capitalize text-xs whitespace-nowrap ${statusColorClass}`}>
                                    {statusToShow.replace('_', ' ')}
                                </Badge>
                            )}
                        </div>
                        {!isLoading && displayItems && (
                            <AdvertisingNumbersDisplay items={displayItems} className="mt-1" />
                        )}
                    </DialogHeader>

                    <div className="flex-grow overflow-y-auto px-6 pt-4 pb-6 custom-scrollbar">
                        {isLoading && (
                            <div className="space-y-4 py-8">
                                <Skeleton className="h-8 w-1/3" />
                                <Skeleton className="h-6 w-1/4" />
                                <Skeleton className="h-24 w-full mt-4" />
                                <Skeleton className="h-8 w-1/4 mt-6" />
                                <Skeleton className="h-40 w-full mt-4" />
                            </div>
                        )}
                        {!isLoading && detailsError && !isEditing && (
                            <div className="flex flex-col items-center justify-center text-destructive text-center py-10">
                                <AlertTriangle className="w-10 h-10 mb-3" />
                                <p className="font-semibold mb-1">Error al cargar detalles</p>
                                <p className="text-sm">{detailsError}</p>
                            </div>
                        )}
                        {editError && (
                            <Alert variant="destructive" className="my-4">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>Error de Edición</AlertTitle>
                                <AlertDescription>{editError}</AlertDescription>
                            </Alert>
                        )}

                        {!isLoading && details && (
                            <>
                                <InvoiceDetailsContent
                                    details={{ ...details, status: details.status, invoice_id: details.invoice_id, preview: displayData ?? undefined }}
                                />

                                <h3 className="text-md font-semibold mt-6 mb-0">Ítems de la Factura</h3>
                                {isEditing ? (
                                    <EditableInvoiceItemsTable
                                        items={editedPreviewData?.items || []}
                                        onItemsChange={handleItemsChange}
                                        currency={editedPreviewData?.currency || details.preview?.currency}
                                        originalItems={originalItemsForEdit}
                                        className="mt-2"
                                    />
                                ) : (
                                    <InvoiceItemsTable
                                        items={displayItems}
                                        currency={displayData?.currency}
                                        className="mt-2"
                                    />
                                )}
                            </>
                        )}
                        {!isLoading && !detailsError && !details && !isEditing && (
                            <p className="text-center text-muted-foreground py-10">No se han cargado detalles.</p>
                        )}
                                    {isEditing && (
                <EditActionBar
                    onConfirm={handleConfirmSave}
                    onCancel={handleCancelEdit}
                    isModified={isModified}
                    isSaving={isSaving}
                />
            )}
                    </div>

                    {!isEditing && canEdit && details && !isLoading && !detailsError && (
                        <DialogFooter className="px-6 py-3 border-t sticky bottom-0 bg-background z-10">
                            <Button variant="outline" onClick={handleEditClick}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar Previsualización
                            </Button>
                        </DialogFooter>
                    )}
                </DialogContent>
            </Dialog>


            <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Cambios</AlertDialogTitle>
                        <AlertDialogDescription>
                            Estás a punto de guardar los cambios en los datos de previsualización.
                            Esta acción actualizará la información utilizada para validaciones posteriores.
                            ¿Estás seguro de que deseas continuar?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isSaving}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={proceedWithSave}
                            disabled={isSaving}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {isSaving ? "Guardando..." : "Confirmar y Guardar"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}