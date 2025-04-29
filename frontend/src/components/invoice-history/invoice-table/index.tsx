'use client'

import React, { useMemo } from 'react'
import { useReactTable, flexRender, getCoreRowModel, getSortedRowModel, getPaginationRowModel, PaginationState } from "@tanstack/react-table"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BulkActionBar } from "@/components/invoice-history/bulk-action-bar"
import { InvoiceDataModal } from "@/components/invoice-data-modal"
import { cn } from "@/lib/utils"

// Importaciones de la nueva estructura
import { useInvoiceTable } from './use-invoice-table'
import { getInvoiceTableColumns } from './columns'
import { TablePagination } from './table-pagination'
import { TableToolbar } from './table-toolbar'

export function InvoiceTable() {
    const {
        // Estado
        data,
        isLoading,
        error,
        totalCount,
        sorting,
        pagination,
        rowSelection,
        searchTerm,
        selectedStatuses,
        updatedRowIds,
        hasActiveFilters,
        isDetailModalOpen,
        viewingInvoiceId,
        // Estado WS directo del contexto (si fuera necesario aquí)
        isWsConnected,
        wsConnectError,
        // Setters y Handlers
        setSorting,
        setPagination,
        setRowSelection,
        setSearchTerm,
        setSelectedStatuses,
        fetchData,
        resetFilters,
        openDetailsModal,
        setIsDetailModalOpen
    } = useInvoiceTable();

    // Definir columnas (sin cambios)
    const columns = useMemo(() => getInvoiceTableColumns(
        () => fetchData(true),
        openDetailsModal
    ), [fetchData, openDetailsModal]);

    // Instancia de la tabla (sin cambios)
    const table = useReactTable({
        data,
        columns,
        state: {
            sorting,
            pagination,
            rowSelection,
        },
        enableRowSelection: true,
        onRowSelectionChange: setRowSelection,
        manualPagination: true,
        manualSorting: true,
        manualFiltering: true,
        pageCount: Math.ceil(totalCount / pagination.pageSize),
        onSortingChange: setSorting,
        onPaginationChange: setPagination,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        debugTable: process.env.NODE_ENV === 'development',
    });

    // Obtener datos de filas seleccionadas para BulkActionBar (sin cambios)
    const selectedRowsData = useMemo(() => {
        return table.getSelectedRowModel().rows.map(row => row.original);
    }, [rowSelection, table]);

    return (
        <div className="space-y-4 relative pb-20"> {/* Padding para BulkActionBar */}
            {/* Barra de Herramientas - eliminamos props que ya no existen */}
            <TableToolbar
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                selectedStatuses={selectedStatuses}
                setSelectedStatuses={(updater) => {
                    setSelectedStatuses(updater);
                    setPagination((p: PaginationState) => ({ ...p, pageIndex: 0 }));
                    setRowSelection({});
                }}
                hasActiveFilters={hasActiveFilters}
                resetFilters={resetFilters}
                // Ya no pasamos isLive, isConnectingWs, toggleLiveUpdates
            />

            {/* Tabla Principal (sin cambios) */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id} style={{ width: header.column.getSize() !== 150 ? header.column.getSize() : undefined }}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    Cargando datos...
                                </TableCell>
                            </TableRow>
                        ) : error ? (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center text-destructive">
                                    Error: {error}
                                </TableCell>
                            </TableRow>
                        ) : table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                    className={cn(
                                        updatedRowIds.has(row.original.id) && "animate-row-highlight",
                                        row.getIsSelected() && "bg-muted/50"
                                    )}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    No se encontraron resultados.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Paginación (sin cambios) */}
            <TablePagination table={table} totalCount={totalCount} />

            {/* Barra de Acciones en Masa (sin cambios) */}
            <BulkActionBar
                selectedInvoices={selectedRowsData}
                onActionComplete={() => fetchData(true)}
                onClearSelection={() => setRowSelection({})} 
            />

            {/* Modal de Detalles (sin cambios) */}
            <InvoiceDataModal
                isOpen={isDetailModalOpen}
                invoiceId={viewingInvoiceId}
                onOpenChange={setIsDetailModalOpen}
            />
        </div>
    );
} 