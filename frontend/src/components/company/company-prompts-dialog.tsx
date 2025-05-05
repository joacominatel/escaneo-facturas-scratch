"use client";

import React, { useState } from 'react';
import { useCompanyPrompts } from '@/hooks/companies/use-company-prompts';
import { useUpdateCompanyPrompt } from '@/hooks/companies/use-update-company-prompt';
import type { Company } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogClose,
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle, PlusCircle } from 'lucide-react';
import { PromptItem } from './prompt-item';

interface UpdatePromptFormProps {
    companyId: number;
    currentDefaultPromptContent: string | null;
    onSuccess: () => void;
}

function UpdatePromptForm({ companyId, currentDefaultPromptContent, onSuccess }: UpdatePromptFormProps) {
    const [newContent, setNewContent] = useState(currentDefaultPromptContent || '');
    const { mutate: updatePrompt, isLoading, error } = useUpdateCompanyPrompt();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newContent.trim()) {
            console.error("El contenido no puede estar vacío");
            return;
        }
        try {
            await updatePrompt(companyId, newContent);
            onSuccess();
        } catch (err) {
            console.error("Fallo al actualizar prompt desde form:", err);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-1 items-center gap-4">
                    <Label htmlFor={`prompt-content-${companyId}`} className="sr-only">
                        Contenido del Nuevo Prompt
                    </Label>
                    <Textarea
                        id={`prompt-content-${companyId}`}
                        placeholder="Pega o escribe aquí el nuevo contenido del prompt..."
                        value={newContent}
                        onChange={(e) => setNewContent(e.target.value)}
                        rows={15}
                        className="col-span-3 text-xs"
                        required
                        disabled={isLoading}
                    />
                </div>
                {error && (
                     <Alert variant="destructive" className="mt-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error al Actualizar</AlertTitle>
                        <AlertDescription>{error.message}</AlertDescription>
                    </Alert>
                )}
            </div>
            <DialogFooter>
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Guardar Nueva Versión
                </Button>
            </DialogFooter>
        </form>
    );
}

interface CompanyPromptsDialogProps {
    company: Company;
    children: React.ReactNode;
}

export function CompanyPromptsDialog({ company, children }: CompanyPromptsDialogProps) {
    const [isListDialogOpen, setIsListDialogOpen] = useState(false);
    const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
    const { prompts, isLoading: isLoadingPrompts, error: promptsError, refetch: refetchPrompts } = useCompanyPrompts(isListDialogOpen ? company.id : null);
    
    const currentDefaultPrompt = prompts.find(p => p.is_default);
    const placeholderDefaultContent = currentDefaultPrompt ? `// Contenido actual de la v${currentDefaultPrompt.version}\n// Edita o reemplaza este texto...` : "";

    const handleSetDefaultSuccess = () => {
        refetchPrompts();
    };

    const handleUpdateSuccess = () => {
        setIsUpdateDialogOpen(false);
        refetchPrompts();
    };

    return (
        <Dialog open={isListDialogOpen} onOpenChange={setIsListDialogOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-[625px]">
                <DialogHeader className="flex flex-row justify-between items-start">
                    <div>
                        <DialogTitle>Prompts de {company.name}</DialogTitle>
                        <DialogDescription>
                            Historial de versiones. El prompt por defecto (👑) se usa para procesar sus facturas.
                        </DialogDescription>
                    </div>
                    <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
                         <DialogTrigger asChild>
                                <div className="flex items-center text-sm w-[200px] hover:cursor-pointer hover:bg-gray-100 rounded-md p-2">
                                    <PlusCircle className="mr-2 h-4 w-4" /> Nueva Versión
                                </div>
                         </DialogTrigger>
                         <DialogContent className="sm:max-w-[700px]">
                             <DialogHeader>
                                 <DialogTitle>Actualizar Prompt para {company.name}</DialogTitle>
                                 <DialogDescription>
                                     Se creará una nueva versión del prompt y se marcará como la opción por defecto.
                                 </DialogDescription>
                             </DialogHeader>
                             <UpdatePromptForm 
                                companyId={company.id} 
                                currentDefaultPromptContent={placeholderDefaultContent}
                                onSuccess={handleUpdateSuccess}
                             />
                         </DialogContent>
                    </Dialog>
                </DialogHeader>
                
                <div className="py-4">
                    {isLoadingPrompts && (
                        <div className="flex items-center justify-center p-6">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            <span className="ml-3 text-muted-foreground">Cargando prompts...</span>
                        </div>
                    )}
                    {promptsError && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>No se pudieron cargar los prompts: {promptsError.message}</AlertDescription>
                        </Alert>
                    )}
                    {!isLoadingPrompts && !promptsError && prompts.length === 0 && (
                        <p className="text-center text-muted-foreground py-4">No se encontraron prompts para esta compañía.</p>
                    )}
                    {!isLoadingPrompts && !promptsError && prompts.length > 0 && (
                        <ScrollArea className="h-[350px]">
                            <Accordion type="single" collapsible className="w-full">
                                {prompts
                                    .sort((a, b) => b.version - a.version)
                                    .map((prompt) => (
                                        <PromptItem 
                                            key={prompt.id} 
                                            companyId={company.id}
                                            prompt={prompt} 
                                            onSetDefaultSuccess={handleSetDefaultSuccess}
                                        />
                                ))}
                            </Accordion>
                        </ScrollArea>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsListDialogOpen(false)}>Cerrar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
} 