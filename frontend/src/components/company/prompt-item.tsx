"use client";

import React from 'react';
import type { CompanyPrompt } from '@/lib/api';
import { useSetPromptDefault } from '@/hooks/companies/use-set-prompt-default'; // Importar hook
import { Button } from '@/components/ui/button';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Loader2, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { PromptContentDisplay } from './prompt-content-display'; // Importar subcomponente

interface PromptItemProps {
    companyId: number;
    prompt: CompanyPrompt;
    onSetDefaultSuccess: () => void; // Callback para refrescar lista tras éxito
    // isSetDefaultDisabled: boolean; // Ya no es necesario, el hook maneja isLoading
}

export function PromptItem({ companyId, prompt, onSetDefaultSuccess }: PromptItemProps) {
    const { mutate: setDefault, isLoading: isSettingDefault } = useSetPromptDefault(); // Usar hook

    const handleSetDefaultClick = async (e: React.MouseEvent) => {
        e.stopPropagation(); // Evitar que el acordeón se abra/cierre
        try {
            await setDefault(companyId, prompt.id);
            onSetDefaultSuccess(); // Llamar al callback para refrescar
        } catch (error) {
            // El error ya se maneja (log/toast) en el hook
            console.error("Fallo al marcar como default desde el componente:", error);
        }
    };

    return (
        <AccordionItem value={`prompt-${prompt.id}`} key={prompt.id}>
            <AccordionTrigger className="hover:no-underline text-sm px-4">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                        {prompt.is_default && (
                            <Crown className="h-4 w-4 text-yellow-500" />
                        )}
                        <span className={cn("font-medium", prompt.is_default ? "text-foreground" : "text-muted-foreground")}>
                            Versión {prompt.version}
                        </span>
                        {prompt.created_at && (
                             <span className="text-xs text-muted-foreground">
                                (Creado {formatDistanceToNow(new Date(prompt.created_at), { addSuffix: true, locale: es })})
                             </span>
                         )}
                    </div>
                     {/* Botón para marcar como default */}
                     {!prompt.is_default && (
                         <Button
                             size="sm"
                             variant="ghost"
                             className="text-xs h-7 px-2 mr-2"
                             onClick={handleSetDefaultClick} // Usar nueva función
                             disabled={isSettingDefault} // Usar isLoading del hook
                             title="Marcar como Prompt por Defecto"
                         >
                             {isSettingDefault ? <Loader2 className="h-3 w-3 animate-spin" /> : <Crown className="h-3 w-3 mr-1" />}
                             Marcar Default
                         </Button>
                     )}
                 </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
                <PromptContentDisplay companyId={companyId} promptId={prompt.id} />
            </AccordionContent>
        </AccordionItem>
    );
} 