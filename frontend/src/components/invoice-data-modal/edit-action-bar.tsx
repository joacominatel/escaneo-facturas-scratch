import React from 'react';
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Undo2, Redo2 } from "lucide-react";
import { cn } from '@/lib/utils';

interface EditActionBarProps {
    onConfirm: () => void;
    onCancel: () => void;
    onUndo?: () => void; // Opcional por ahora
    onRedo?: () => void; // Opcional por ahora
    isModified: boolean;
    isSaving: boolean;
    className?: string;
}

export function EditActionBar({
    onConfirm,
    onCancel,
    onUndo,
    onRedo,
    isModified,
    isSaving,
    className
}: EditActionBarProps) {
    return (
        <div
            className={cn(
                "fixed bottom-4 left-1/2 transform -translate-x-1/2 z-[100]",
                "flex items-center gap-3 p-2.5 rounded-full shadow-lg",
                "bg-background border border-border",
                className
            )}
        >
            <Button
                variant="outline"
                size="icon"
                onClick={onUndo}
                disabled={!onUndo || isSaving} // Deshabilitado si no hay función o se está guardando
                aria-label="Deshacer"
                className="rounded-full"
            >
                <Undo2 className="h-4 w-4" />
            </Button>
            <Button
                variant="outline"
                size="icon"
                onClick={onRedo}
                disabled={!onRedo || isSaving} // Deshabilitado si no hay función o se está guardando
                aria-label="Rehacer"
                className="rounded-full"
            >
                <Redo2 className="h-4 w-4" />
            </Button>

            <div className="h-6 border-l border-border mx-1"></div> {/* Separador */}

            <Button
                variant="ghost"
                size="sm"
                onClick={onCancel}
                disabled={isSaving}
                className="rounded-full px-4 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
                <XCircle className="h-4 w-4 mr-1.5" />
                Cancelar
            </Button>
            <Button
                size="sm"
                onClick={onConfirm}
                disabled={!isModified || isSaving}
                className="rounded-full px-4 bg-green-600 hover:bg-green-700 text-white"
            >
                {isSaving ? (
                    <>
                         <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Guardando...
                    </>
                ) : (
                    <>
                        <CheckCircle className="h-4 w-4 mr-1.5" />
                        Confirmar Cambios
                    </>
                )}
            </Button>
        </div>
    );
} 