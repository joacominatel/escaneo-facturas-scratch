"use client"

import { TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowDown, ArrowUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"

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
  selectionMode?: boolean
  allSelected?: boolean
  onToggleSelectAll?: () => void
}

export function InvoiceTableHeader({
  currentSort,
  currentOrder,
  onSort,
  selectionMode = false,
  allSelected = false,
  onToggleSelectAll
}: InvoiceTableHeaderProps) {
  return (
    <TableHeader>
      <TableRow>
        {selectionMode && (
          <TableHead className="w-10 pr-0">
            <Checkbox 
              checked={allSelected}
              onCheckedChange={onToggleSelectAll}
              aria-label="Seleccionar todas las facturas"
              className="translate-y-[2px]"
            />
          </TableHead>
        )}
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