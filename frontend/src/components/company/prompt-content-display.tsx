"use client";

import React, { useEffect } from 'react';
import { usePromptContent } from '@/hooks/companies/use-prompt-content';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, AlertCircle } from 'lucide-react';

interface PromptContentDisplayProps {
    promptId: number;
    companyId: number;
}

export function PromptContentDisplay({ companyId, promptId }: PromptContentDisplayProps) {
    const { content, isLoading, error, fetchContent } = usePromptContent(companyId, promptId);

    useEffect(() => {
        // Cargar contenido la primera vez que se monta (si hay ID)
        if (promptId) {
            fetchContent();
        }
    }, [fetchContent, promptId]); // Dependencia fetchContent asegura que se llame una vez

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Cargando contenido...</span>
            </div>
        );
    }

    if (error) {
        return (
            <Alert variant="destructive" className="my-2">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>No se pudo cargar el contenido del prompt: {error.message}</AlertDescription>
            </Alert>
        );
    }

    if (!content) {
        return <p className="text-sm text-muted-foreground p-4">No hay contenido para mostrar.</p>;
    }

    return (
        <ScrollArea className="h-[200px] w-full rounded-md border bg-muted/50 p-3 my-2">
            <pre className="text-xs whitespace-pre-wrap break-words"><code>{content}</code></pre>
        </ScrollArea>
    );
} 