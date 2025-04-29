import React from 'react';
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { StatusFilter } from "./status-filter";
import { LiveUpdateButton } from "@/components/invoice-history/live-update-button";
import { InvoiceStatus } from "@/lib/api/types";
import { SearchBar } from "@/components/search-bar";

interface TableToolbarProps {
    initialSearchTerm?: string;
    selectedStatuses: Set<InvoiceStatus>;
    setSelectedStatuses: React.Dispatch<React.SetStateAction<Set<InvoiceStatus>>>;
    hasActiveFilters: boolean;
    resetFilters: () => void;
    isLive: boolean;
    isConnectingWs: boolean;
    toggleLiveUpdates: () => void;
}

export function TableToolbar({
    initialSearchTerm,
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
                <SearchBar className="h-8 w-full sm:w-[200px] lg:w-[250px]" />
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