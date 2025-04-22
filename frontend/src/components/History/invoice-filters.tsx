
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon, RefreshCw, Search } from 'lucide-react'
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"

interface InvoiceFiltersProps {
  onFiltersChange: (filters: Record<string, any>) => void
  onRefresh: () => void
}

export function InvoiceFilters({ onFiltersChange, onRefresh }: InvoiceFiltersProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [date, setDate] = useState<Date | undefined>(undefined)

  // Efecto para aplicar filtros cuando cambian
  useEffect(() => {
    const filters: Record<string, any> = {}

    if (statusFilter !== "all") {
      filters.status = statusFilter
    }

    if (date) {
      filters.date = format(date, "yyyy-MM-dd")
    }

    onFiltersChange(filters)
  }, [statusFilter, date, onFiltersChange])

  // Función para manejar la búsqueda
  const handleSearch = () => {
    if (searchTerm.trim()) {
      onFiltersChange({ op_number: searchTerm.trim() })
    } else {
      // Si el término de búsqueda está vacío, eliminamos el filtro
      const filters: Record<string, any> = {}
      if (statusFilter !== "all") {
        filters.status = statusFilter
      }
      if (date) {
        filters.date = format(date, "yyyy-MM-dd")
      }
      onFiltersChange(filters)
    }
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex w-full max-w-sm items-center space-x-2">
        <Input
          placeholder="Buscar por número de factura..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-9"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSearch()
            }
          }}
        />
        <Button variant="outline" size="sm" className="h-9 px-3" onClick={handleSearch}>
          <Search className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 w-[180px]">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="processed">Procesadas</SelectItem>
            <SelectItem value="waiting_validation">Pendientes</SelectItem>
            <SelectItem value="processing">En proceso</SelectItem>
            <SelectItem value="failed">Fallidas</SelectItem>
            <SelectItem value="rejected">Rechazadas</SelectItem>
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn("h-9 w-[240px] justify-start text-left font-normal", !date && "text-muted-foreground")}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP", { locale: es }) : "Filtrar por fecha"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(date) => {
                setDate(date)
              }}
              initialFocus
            />
            {date && (
              <div className="p-3 border-t border-border flex justify-end">
                <Button variant="ghost" size="sm" onClick={() => setDate(undefined)}>
                  Limpiar
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>

        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onRefresh} title="Actualizar">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
