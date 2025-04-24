"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon, RefreshCw, Search } from 'lucide-react'
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { useDebounce } from "@/hooks/useDebounce"
import { toast } from "sonner"

interface InvoiceFiltersProps {
  onFiltersChange: (filters: Record<string, any>) => void
  onRefresh: () => void
}

export function InvoiceFilters({ onFiltersChange, onRefresh }: InvoiceFiltersProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [date, setDate] = useState<Date | undefined>(undefined)

  // Aplicar debounce al término de búsqueda
  const debouncedSearchTerm = useDebounce(searchTerm, 500)

  // Efecto para aplicar filtros cuando cambian
  useEffect(() => {
    const filters: Record<string, any> = {}

    if (statusFilter !== "all") {
      filters.status = statusFilter
    }

    if (date) {
      filters.date = format(date, "yyyy-MM-dd")
    }

    if (debouncedSearchTerm.trim()) {
      filters.search = debouncedSearchTerm.trim() // Cambiado de op_number a search
    }

    onFiltersChange(filters)
  }, [statusFilter, date, debouncedSearchTerm, onFiltersChange])

  // Función para manejar el cambio de estado
  const handleStatusChange = useCallback((value: string) => {
    setStatusFilter(value)
  }, [])

  // Función para manejar el cambio de fecha
  const handleDateChange = useCallback((value: Date | undefined) => {
    setDate(value)
  }, [])

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex w-full max-w-sm items-center space-x-2">
        <Input
          placeholder="Buscar por número de factura..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-9"
        />
        <Button
          variant="outline"
          size="sm"
          className="h-9 px-3"
          onClick={() => setSearchTerm(searchTerm)}
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Select value={statusFilter} onValueChange={handleStatusChange}>
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
            <Calendar mode="single" selected={date} onSelect={handleDateChange} initialFocus />
            {date && (
              <div className="p-3 border-t border-border flex justify-end">
                <Button variant="ghost" size="sm" onClick={() => handleDateChange(undefined)}>
                  Limpiar
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>

        <Button 
          variant="ghost" 
          size="icon" 
          className="h-9 w-9 transition-transform hover:rotate-180 duration-500" 
          onClick={() => {
            const button = document.getElementById('refresh-button');
            if (button) {
              button.classList.add('animate-spin');
              setTimeout(() => {
                button.classList.remove('animate-spin');
              }, 1000);
            }
            onRefresh();
            toast.success("Filtros actualizados", {
              description: "La lista de facturas ha sido actualizada"
            });
          }} 
          title="Actualizar"
          id="refresh-button"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
