import React from 'react';
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { StatusFilter } from "./status-filter";
import { InvoiceStatus } from "@/lib/api/types";
import { Input } from "@/components/ui/input";
import { useWebSocket } from "@/contexts/websocket-context";
import { cn } from "@/lib/utils";

interface TableToolbarProps {
    searchTerm: string;
    setSearchTerm: (value: string) => void;
    selectedStatuses: Set<InvoiceStatus>;
    setSelectedStatuses: React.Dispatch<React.SetStateAction<Set<InvoiceStatus>>>;
    hasActiveFilters: boolean;
    resetFilters: () => void;
}

const WebSocketStatusIndicator = () => {
    const { isConnected, connectError } = useWebSocket();

    let color = "bg-gray-400";
    let title = "Live Desconectado";

    if (isConnected) {
        color = "bg-green-500";
        title = "Live Conectado";
    } else if (connectError) {
        color = "bg-red-500";
        title = `Error Conexión Live`;
    }

    return (
        <div className="flex items-center space-x-1 sm:space-x-2" title={title}>
            <span className={cn("h-2.5 w-2.5 rounded-full", color, isConnected && "animate-pulse")}></span>
            <span className="text-xs text-muted-foreground hidden md:inline">
                 {isConnected ? "Live" : (connectError ? "Error" : "Offline")}
            </span>
        </div>
    );
};

export function TableToolbar({
    searchTerm,
    setSearchTerm,
    selectedStatuses,
    setSelectedStatuses,
    hasActiveFilters,
    resetFilters,
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

            {/* Indicador de estado WebSocket global */}
            <WebSocketStatusIndicator />
        </div>
    );
} 