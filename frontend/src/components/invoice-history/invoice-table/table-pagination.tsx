import React from 'react';
import { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface TablePaginationProps<TData> {
    table: Table<TData>;
    totalCount: number; // Pasar el total de filas desde el estado principal
}

export function TablePagination<TData>({ table, totalCount }: TablePaginationProps<TData>) {
    const { pageIndex, pageSize } = table.getState().pagination;
    const selectedRowCount = table.getFilteredSelectedRowModel().rows.length;
    const pageCount = table.getPageCount();

    return (
        <div className="flex items-center justify-between space-x-2 py-4">
            {/* Información de selección y total */}
            <div className="flex-1 text-sm text-muted-foreground">
                {selectedRowCount > 0 && (
                    <span>
                        {selectedRowCount} de{" "}
                    </span>
                )}
                {totalCount} fila(s) en total.
                {selectedRowCount > 0 && (
                    <Button
                        variant="link"
                        size="sm"
                        className="ml-4 h-auto p-0 text-xs"
                        onClick={() => table.resetRowSelection()} // Usar método de la tabla
                    >
                        Limpiar selección
                    </Button>
                )}
            </div>

            {/* Controles de paginación */}
            <div className="flex items-center space-x-6 lg:space-x-8">
                {/* Selector de tamaño de página */}
                <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium">Filas por página</p>
                    <Select
                        value={`${pageSize}`}
                        onValueChange={(value) => {
                            table.setPageSize(Number(value));
                            // Limpiar selección se maneja ahora en onPaginationChange del hook principal si es necesario
                        }}
                    >
                        <SelectTrigger className="h-8 w-[70px]">
                            <SelectValue placeholder={pageSize} />
                        </SelectTrigger>
                        <SelectContent side="top">
                            {[10, 20, 30, 40, 50].map((size) => (
                                <SelectItem key={size} value={`${size}`}>
                                    {size}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Indicador de página */}
                <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                    Página {pageIndex + 1} de {pageCount}
                </div>

                {/* Botones de navegación */}
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        className="hidden h-8 w-8 p-0 lg:flex"
                        onClick={() => table.setPageIndex(0)}
                        disabled={!table.getCanPreviousPage()}
                    >
                        <span className="sr-only">Ir a primera página</span>
                        <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        <span className="sr-only">Ir a página anterior</span>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        <span className="sr-only">Ir a página siguiente</span>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        className="hidden h-8 w-8 p-0 lg:flex"
                        onClick={() => table.setPageIndex(pageCount - 1)}
                        disabled={!table.getCanNextPage()}
                    >
                        <span className="sr-only">Ir a última página</span>
                        <ChevronsRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
} 