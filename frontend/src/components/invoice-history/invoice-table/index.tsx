'use client'

import React, { useMemo } from 'react'
import { useReactTable, flexRender, getCoreRowModel, getSortedRowModel, getPaginationRowModel, PaginationState } from "@tanstack/react-table"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BulkActionBar } from "@/components/invoice-history/bulk-action-bar" // Mantener ruta original

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
        isLive,
        isConnectingWs,
        hasActiveFilters,
        // Setters y Handlers
        setSorting,
        setPagination,
        setRowSelection,
        setSearchTerm,
        setSelectedStatuses,
        toggleLiveUpdates,
        fetchData,
        resetFilters,
    } = useInvoiceTable();

    // Definir columnas (pasando el fetchData para el onActionComplete)
    const columns = useMemo(() => getInvoiceTableColumns(() => fetchData(true)), [fetchData]);

    // Instancia de la tabla
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
        manualFiltering: true, // Ya que los filtros se aplican en la llamada API
        pageCount: Math.ceil(totalCount / pagination.pageSize),
        onSortingChange: setSorting,
        onPaginationChange: setPagination, // Ahora usa el handler del hook
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        debugTable: process.env.NODE_ENV === 'development',
    });

    // Obtener datos de filas seleccionadas para BulkActionBar
    const selectedRowsData = useMemo(() => {
        return table.getSelectedRowModel().rows.map(row => row.original);
    }, [rowSelection, table]); // Depender de rowSelection y la instancia de tabla

    return (
        <div className="space-y-4 relative pb-20"> {/* Padding para BulkActionBar */}
            {/* Barra de Herramientas */}
            <TableToolbar
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                selectedStatuses={selectedStatuses}
                setSelectedStatuses={(updater) => {
                    // Al cambiar estado, resetear paginación y selección
                    setSelectedStatuses(updater);
                    setPagination((p: PaginationState) => ({ ...p, pageIndex: 0 }));
                    setRowSelection({});
                }}
                hasActiveFilters={hasActiveFilters}
                resetFilters={resetFilters}
                isLive={isLive}
                isConnectingWs={isConnectingWs}
                toggleLiveUpdates={toggleLiveUpdates}
            />

            {/* Tabla Principal */}
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
                                    className={row.getIsSelected() ? "bg-muted/50" : ""}
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

            {/* Paginación */}
            <TablePagination table={table} totalCount={totalCount} />

            {/* Barra de Acciones en Masa */}
            <BulkActionBar
                selectedInvoices={selectedRowsData}
                onActionComplete={() => fetchData(true)}
                onClearSelection={() => setRowSelection({})} // Pasar el setter directamente
            />
        </div>
    );
} 