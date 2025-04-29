import React from 'react';
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { StatusFilter } from "./status-filter";
import { LiveUpdateButton } from "@/components/invoice-history/live-update-button";
import { InvoiceStatus } from "@/lib/api/types";
import { Input } from "@/components/ui/input";

interface TableToolbarProps {
    searchTerm: string;
    setSearchTerm: (value: string) => void;
    selectedStatuses: Set<InvoiceStatus>;
    setSelectedStatuses: React.Dispatch<React.SetStateAction<Set<InvoiceStatus>>>;
    hasActiveFilters: boolean;
    resetFilters: () => void;
    isLive: boolean;
    isConnectingWs: boolean;
    toggleLiveUpdates: () => void;
}

export function TableToolbar({
    searchTerm,
    setSearchTerm,
    selectedStatuses,
    setSelectedStatuses,
    hasActiveFilters,
    resetFilters,
    isLive,
    isConnectingWs,
    toggleLiveUpdates,
}: TableToolbarProps) {

    return (
        <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
            {/* Filtros y búsqueda */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <Input
                    placeholder="Buscar por nombre..."
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    className="h-8 w-[150px] lg:w-[200px]"
                />
                <StatusFilter
                    selectedStatuses={selectedStatuses}
                    setSelectedStatuses={setSelectedStatuses}
                />
                {hasActiveFilters && (
                    <Button
                        variant="ghost"
                        onClick={resetFilters}
                        className="h-8 px-2 lg:px-3 text-muted-foreground hover:text-destructive"
                    >
                        Limpiar filtros
                        <X className="ml-2 h-4 w-4" />
                    </Button>
                )}
            </div>

            {/* Botón Live */}
            <LiveUpdateButton
                isConnected={isLive}
                isConnecting={isConnectingWs}
                onToggle={toggleLiveUpdates}
            />
        </div>
    );
} 