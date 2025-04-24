"use client"

import { TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowDown, ArrowUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface SortableHeaderProps {
  label: string
  field: string
  currentSort: string
  currentOrder: "asc" | "desc"
  onSort: (field: string) => void
  className?: string
}

function SortableHeader({
  label,
  field,
  currentSort,
  currentOrder,
  onSort,
  className
}: SortableHeaderProps) {
  const isSorted = field === currentSort
  const Icon = isSorted ? (currentOrder === "asc" ? ArrowUp : ArrowDown) : null

  return (
    <TableHead className={className}>
      <button 
        type="button"
        onClick={() => onSort(field)}
        className={cn(
          "flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground transition-colors",
          isSorted && "text-foreground"
        )}
      >
        {label}
        {Icon && <Icon className="h-3.5 w-3.5 ml-1" />}
      </button>
    </TableHead>
  )
}

interface InvoiceTableHeaderProps {
  currentSort: string
  currentOrder: "asc" | "desc"
  onSort: (field: string) => void
}

export function InvoiceTableHeader({
  currentSort,
  currentOrder,
  onSort
}: InvoiceTableHeaderProps) {
  return (
    <TableHeader>
      <TableRow>
        <SortableHeader
          label="ID"
          field="id"
          currentSort={currentSort}
          currentOrder={currentOrder}
          onSort={onSort}
        />
        <SortableHeader
          label="Nombre de archivo"
          field="filename"
          currentSort={currentSort}
          currentOrder={currentOrder}
          onSort={onSort}
        />
        <TableHead>Estado</TableHead>
        <SortableHeader
          label="Fecha"
          field="created_at"
          currentSort={currentSort}
          currentOrder={currentOrder}
          onSort={onSort}
        />
        <TableHead className="text-right">Acciones</TableHead>
      </TableRow>
    </TableHeader>
  )
}