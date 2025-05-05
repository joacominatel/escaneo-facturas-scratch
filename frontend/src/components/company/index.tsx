"use client";

import React, { useState } from 'react';
import { useCreateCompany } from '@/hooks/companies/use-create-company';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle, PlusCircle } from 'lucide-react';

interface CreateCompanyDialogProps {
    onSuccess: () => void;
}

export function CreateCompanyDialog({ onSuccess }: CreateCompanyDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [companyName, setCompanyName] = useState("");
    const { mutate: createCompany, isLoading, error } = useCreateCompany();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const newCompany = await createCompany(companyName);
            if (newCompany) {
                onSuccess();
                setCompanyName("");
                setIsOpen(false);
            }
        } catch (err) {
            console.error("Fallo al crear compañía desde diálogo:", err);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button size="sm">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Crear Compañía
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Crear Nueva Compañía</DialogTitle>
                    <DialogDescription>
                        Dale un nombre a tu nueva compañía. Se creará un prompt inicial automáticamente.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Nombre
                            </Label>
                            <Input
                                id="name"
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                placeholder="Ej: Proveedor Tech S.A."
                                className="col-span-3"
                                disabled={isLoading}
                                required
                            />
                        </div>
                        {error && (
                             <Alert variant="destructive" className="col-span-4">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>{error.message}</AlertDescription>
                            </Alert>
                        )}
                    </div>
                    <DialogFooter>
                         <DialogClose asChild>
                            <Button type="button" variant="outline" disabled={isLoading}>Cancelar</Button>
                         </DialogClose>
                        <Button type="submit" disabled={isLoading}>
                             {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Crear
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
