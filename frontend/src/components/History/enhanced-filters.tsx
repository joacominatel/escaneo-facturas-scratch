"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon, RefreshCw, Search, X } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { useDebounce } from "@/hooks/useDebounce"
import { Badge } from "@/components/ui/badge"

interface EnhancedFiltersProps {
  onFiltersChange: (filters: Record<string, any>) => void
  onRefresh: () => void
}

export function EnhancedFilters({ onFiltersChange, onRefresh }: EnhancedFiltersProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [activeFilters, setActiveFilters] = useState<string[]>([])

  // Aplicar debounce al término de búsqueda
  const debouncedSearchTerm = useDebounce(searchTerm, 500)

  // Efecto para aplicar filtros cuando cambian
  useEffect(() => {
    const filters: Record<string, any> = {}
    const newActiveFilters: string[] = []

    if (statusFilter !== "all") {
      filters.status = statusFilter
      newActiveFilters.push(`Estado: ${getStatusLabel(statusFilter)}`)
    }

    if (date) {
      filters.date = format(date, "yyyy-MM-dd")
      newActiveFilters.push(`Fecha: ${format(date, "dd/MM/yyyy")}`)
    }

    if (debouncedSearchTerm.trim()) {
      filters.search = debouncedSearchTerm.trim()
      newActiveFilters.push(`Búsqueda: ${debouncedSearchTerm}`)
    }

    setActiveFilters(newActiveFilters)
    onFiltersChange(filters)
  }, [statusFilter, date, debouncedSearchTerm, onFiltersChange])

  // Función para obtener la etiqueta legible del estado
  const getStatusLabel = (status: string): string => {
    const statusLabels: Record<string, string> = {
      processed: "Procesadas",
      waiting_validation: "Pendientes",
      processing: "En proceso",
      failed: "Fallidas",
      rejected: "Rechazadas",
      all: "Todos",
    }
    return statusLabels[status] || status
  }

  // Función para manejar el cambio de estado
  const handleStatusChange = useCallback((value: string) => {
    setStatusFilter(value)
    toast.success(`Filtro aplicado: ${getStatusLabel(value)}`)
  }, [])

  // Función para manejar el cambio de fecha
  const handleDateChange = useCallback((value: Date | undefined) => {
    setDate(value)
    if (value) {
      toast.success(`Filtro aplicado: ${format(value, "dd/MM/yyyy")}`)
    }
  }, [])

  // Función para limpiar todos los filtros
  const clearAllFilters = useCallback(() => {
    setSearchTerm("")
    setStatusFilter("all")
    setDate(undefined)
    toast.success("Todos los filtros han sido eliminados")
  }, [])

  // Función para manejar la búsqueda
  const handleSearch = useCallback(() => {
    if (searchTerm.trim()) {
      toast.success(`Buscando: ${searchTerm}`)
    }
  }, [searchTerm])

  // Función para manejar el refresh con animación
  const handleRefresh = useCallback(() => {
    const button = document.getElementById("refresh-button")
    if (button) {
      button.classList.add("animate-spin")
      setTimeout(() => {
        button.classList.remove("animate-spin")
      }, 1000)
    }

    onRefresh()
    toast.success("Lista actualizada", {
      description: "La lista de facturas ha sido actualizada",
    })
  }, [onRefresh])

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full max-w-sm items-center space-x-2">
          <Input
            placeholder="Buscar facturas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-9"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch()
              }
            }}
          />
          <Button
            variant="outline"
            size="sm"
            className="h-9 px-3 transition-all hover:bg-primary hover:text-primary-foreground"
            onClick={handleSearch}
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
                className={cn("h-9 w-[180px] justify-start text-left font-normal", !date && "text-muted-foreground")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "dd/MM/yyyy", { locale: es }) : "Filtrar por fecha"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={date} onSelect={handleDateChange} initialFocus locale={es} />
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
            className="h-9 w-9 transition-transform duration-500"
            onClick={handleRefresh}
            title="Actualizar"
            id="refresh-button"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Mostrar filtros activos */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Filtros activos:</span>
          {activeFilters.map((filter, index) => (
            <Badge key={index} variant="secondary" className="flex items-center gap-1">
              {filter}
            </Badge>
          ))}
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={clearAllFilters}>
            <X className="h-3 w-3 mr-1" /> Limpiar filtros
          </Button>
        </div>
      )}
    </div>
  )
}
