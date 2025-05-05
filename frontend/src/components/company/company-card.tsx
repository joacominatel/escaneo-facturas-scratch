"use client";

import React from 'react';
import type { Company } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import { CompanyPromptsDialog } from './company-prompts-dialog'; // Importar subcomponente

interface CompanyCardProps {
    company: Company;
}

export function CompanyCard({ company }: CompanyCardProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-semibold">{company.name}</CardTitle>
                {/* Botón que abre el Dialog */} 
                <CompanyPromptsDialog company={company}>
                    <Button variant="outline" size="sm" className="h-8">
                        <FileText className="mr-2 h-4 w-4" /> Ver Prompts
                    </Button>
                </CompanyPromptsDialog>
            </CardHeader>
            <CardContent>
                <p className="text-xs text-muted-foreground">
                    ID: {company.id} - Creado: {company.created_at ? new Date(company.created_at).toLocaleDateString() : 'N/A'}
                </p>
            </CardContent>
        </Card>
    );
} 