import React from 'react';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Filter } from "lucide-react";
import { InvoiceStatus } from "@/lib/api/types";
import { INVOICE_STATUSES } from "./constants";

interface StatusFilterProps {
    selectedStatuses: Set<InvoiceStatus>;
    setSelectedStatuses: React.Dispatch<React.SetStateAction<Set<InvoiceStatus>>>;
    // Opcional: Callbacks si necesitas ejecutar algo más al cambiar o limpiar
    // onChange?: () => void;
    // onClear?: () => void;
}

export function StatusFilter({ selectedStatuses, setSelectedStatuses }: StatusFilterProps) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="ml-2 h-8 border-dashed">
                    <Filter className="mr-2 h-4 w-4" />
                    Estado
                    {selectedStatuses.size > 0 ? (
                        <span className="ml-2 rounded-md bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                            {selectedStatuses.size}
                        </span>
                    ) : null}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0" align="start">
                <Command>
                    <CommandList>
                        <CommandEmpty>No encontrado.</CommandEmpty>
                        <CommandGroup>
                            {INVOICE_STATUSES.map((status) => (
                                <CommandItem
                                    key={status}
                                    onSelect={() => {
                                        setSelectedStatuses(prev => {
                                            const next = new Set(prev);
                                            if (next.has(status)) next.delete(status);
                                            else next.add(status);
                                            return next;
                                        });
                                        // onChange?.(); // Llamar callback si existe
                                    }}
                                >
                                    <Checkbox
                                        className="mr-2"
                                        checked={selectedStatuses.has(status)}
                                        aria-labelledby={`filter-label-${status}`}
                                    />
                                    <span id={`filter-label-${status}`} className="capitalize">
                                        {status.replace('_', ' ')}
                                    </span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}