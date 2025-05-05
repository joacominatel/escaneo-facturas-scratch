"use client";

import React, { useState } from 'react';
import { useCompanyPrompts } from '@/hooks/companies/use-company-prompts';
import type { Company } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Accordion,
} from '@/components/ui/accordion';
import {
    ScrollArea
} from '@/components/ui/scroll-area';
import {
    Alert, AlertDescription, AlertTitle
} from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';
import { PromptItem } from './prompt-item'; // Importar subcomponente

interface CompanyPromptsDialogProps {
    company: Company;
    children: React.ReactNode; // Para el DialogTrigger
}

export function CompanyPromptsDialog({ company, children }: CompanyPromptsDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isSettingDefault, setIsSettingDefault] = useState(false); // Estado para la acción
    // Carga los prompts solo si el diálogo está abierto
    const { prompts, isLoading, error, refetch } = useCompanyPrompts(isOpen ? company.id : null);

    const handleSetDefault = async (promptId: number) => {
        setIsSettingDefault(true);
        console.warn(`Funcionalidad "Marcar como Default" (Prompt ID: ${promptId}) no implementada aún.`);
        // TODO: Implementar llamada a API cuando esté lista
        // try {
        //   await setPromptAsDefault(company.id, promptId);
        //   refetch(); // Recargar lista de prompts
        //   // Mostrar notificación de éxito (Toast)
        // } catch (err) { 
        //   // Mostrar notificación de error (Toast)
        //   console.error("Error al marcar prompt como default:", err);
        // } finally {
           // Simular delay para feedback visual
            await new Promise(resolve => setTimeout(resolve, 500)); 
            setIsSettingDefault(false);
        // }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                    <DialogTitle>Prompts de {company.name}</DialogTitle>
                    <DialogDescription>
                        Historial de versiones de prompts para esta compañía. El prompt por defecto (👑) se usa para procesar sus facturas.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    {isLoading && (
                        <div className="flex items-center justify-center p-6">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            <span className="ml-3 text-muted-foreground">Cargando prompts...</span>
                        </div>
                    )}
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>No se pudieron cargar los prompts: {error.message}</AlertDescription>
                        </Alert>
                    )}
                    {!isLoading && !error && prompts.length === 0 && (
                        <p className="text-center text-muted-foreground py-4">No se encontraron prompts para esta compañía.</p>
                    )}
                    {!isLoading && !error && prompts.length > 0 && (
                        <ScrollArea className="h-[350px]">
                            <Accordion type="single" collapsible className="w-full">
                                {prompts
                                    // Ordenar por versión descendente para mostrar el más nuevo arriba
                                    .sort((a, b) => b.version - a.version)
                                    .map((prompt) => (
                                        <PromptItem 
                                            key={prompt.id} 
                                            companyId={company.id} // Pasar companyId a PromptItem
                                            prompt={prompt} 
                                            onSetDefault={handleSetDefault} 
                                            isSetDefaultDisabled={isSettingDefault}
                                        />
                                ))}
                            </Accordion>
                        </ScrollArea>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Cerrar</Button>
                    {/* TODO: Añadir botón para crear nuevo prompt aquí en el futuro */} 
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
} 