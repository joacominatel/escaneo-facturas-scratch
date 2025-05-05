"use client";

import React from 'react';
import { useCompanies } from '@/hooks/companies/use-companies';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';
import { CompanyCard } from './company-card';

// --- Componente Principal de la Página --- 
export default function CompanyPage() {
    const { companies, isLoading, error, refetch } = useCompanies();

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold tracking-tight mb-6">Gestión de Compañías</h1>

            {/* TODO: Añadir botón para crear nueva compañía en el futuro */} 

            {isLoading && (
                <div className="flex items-center justify-center pt-20">
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
                <p className="text-center text-muted-foreground pt-10">No hay compañías registradas.</p>
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