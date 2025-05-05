"use client";

import React, { useState } from 'react';
import { useCompanies } from '@/hooks/companies/use-companies';
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertCircle, PlusCircle, Building2, Lightbulb, FileText, Wand2 } from 'lucide-react';
import { CompanyCard } from './company-card';

// --- Componente: Diálogo de Creación --- 
interface CreateCompanyDialogProps {
    onSuccess: () => void;
}

function CreateCompanyDialog({ onSuccess }: CreateCompanyDialogProps) {
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

// --- Componente: Guía Interactiva --- 
function CompanyGuide() {
    return (
        <Card className="mb-8 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-900/30 dark:via-purple-900/30 dark:to-pink-900/30 border-purple-200 dark:border-purple-800/50 shadow-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl text-purple-800 dark:text-purple-300">
                    <Lightbulb className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    ¿Por qué crear Compañías?
                </CardTitle>
                <p className="text-sm text-muted-foreground pt-1">
                    Optimiza la extracción de datos de facturas recurrentes de un mismo origen.
                </p>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
                <div className="flex items-start gap-3 p-3 bg-white/50 dark:bg-black/20 rounded-lg border border-white dark:border-gray-700/50">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700/50">
                        <Building2 className="h-4 w-4" />
                    </div>
                    <div>
                        <p className="font-medium text-blue-900 dark:text-blue-200">Identifica Proveedores/Clientes</p>
                        <p className="text-muted-foreground text-xs">
                            Agrupa facturas que provienen del mismo lugar (por ejemplo, un proveedor específico).
                        </p>
                    </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-white/50 dark:bg-black/20 rounded-lg border border-white dark:border-gray-700/50">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700/50">
                        <Wand2 className="h-4 w-4" />
                    </div>
                    <div>
                        <p className="font-medium text-green-900 dark:text-green-200">Prompts Personalizados</p>
                        <p className="text-muted-foreground text-xs">
                            Cada compañía tiene su propio "prompt" (instrucciones para la IA), adaptado a la estructura única de sus facturas.
                        </p>
                    </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-white/50 dark:bg-black/20 rounded-lg border border-white dark:border-gray-700/50">
                     <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pink-100 dark:bg-pink-900/50 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-700/50">
                        <FileText className="h-4 w-4" />
                    </div>
                    <div>
                        <p className="font-medium text-pink-900 dark:text-pink-200">Mayor Precisión</p>
                        <p className="text-muted-foreground text-xs">
                            Al usar un prompt específico, la IA extrae los datos (importes, fechas, ítems) con más exactitud.
                        </p>
                    </div>
                </div>
                 <p className="text-xs text-center pt-2 text-muted-foreground">Al subir una factura, podrás asociarla a una compañía existente.</p>
            </CardContent>
        </Card>
    );
}

// --- Componente Principal de la Página --- 
export default function CompanyPage() {
    const { companies, isLoading, error, refetch } = useCompanies();

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold tracking-tight">Gestión de Compañías</h1>
                 <CreateCompanyDialog onSuccess={refetch} />
            </div>

            <CompanyGuide />

            {isLoading && (
                <div className="flex items-center justify-center pt-10">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <span className="ml-3 text-lg text-muted-foreground">Cargando compañías...</span>
                </div>
            )}

            {error && (
                 <Alert variant="destructive" className="max-w-2xl mx-auto">
                     <AlertCircle className="h-4 w-4" />
                     <AlertTitle>Error al Cargar Compañías</AlertTitle>
                     <AlertDescription>
                         <p>No se pudieron obtener los datos de las compañías.</p>
                         <p className="text-xs mt-1">Detalle: {error.message}</p>
                         <Button variant="secondary" size="sm" onClick={refetch} className="mt-3">
                             Reintentar
                         </Button>
                     </AlertDescription>
                 </Alert>
            )}

            {!isLoading && !error && companies.length === 0 && (
                <p className="text-center text-muted-foreground pt-10">No hay compañías registradas. ¡Crea la primera!</p>
            )}

            {!isLoading && !error && companies.length > 0 && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {companies.map((company) => (
                        <CompanyCard key={company.id} company={company} />
                    ))}
                </div>
            )}
        </div>
    );
} 