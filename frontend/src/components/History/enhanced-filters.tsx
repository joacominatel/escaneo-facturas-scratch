"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RefreshCw, Search } from 'lucide-react'

interface EnhancedFiltersProps {
  onFiltersChange: (filters: Record<string, any>) => void
  onRefresh: () => void
  initialSearch?: string
  initialStatus?: string
}

export function EnhancedFilters({
  onFiltersChange,
  onRefresh,
  initialSearch = "",
  initialStatus = "all"
}: EnhancedFiltersProps) {
  const [searchQuery, setSearchQuery] = useState(initialSearch || "")
  const [statusFilter, setStatusFilter] = useState(initialStatus)

  // Initialize from props only once
  useEffect(() => {
    setSearchQuery(initialSearch || "")
    setStatusFilter(initialStatus || "all")
  }, [initialSearch, initialStatus])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    
    onFiltersChange({
      search: searchQuery,
      status: statusFilter === "all" ? undefined : statusFilter
    })
  }

  const handleStatusChange = (value: string) => {
    setStatusFilter(value)
    
    onFiltersChange({
      search: searchQuery,
      status: value === "all" ? undefined : value
    })
  }

  const handleRefresh = () => {
    onRefresh()
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      <form onSubmit={handleSearch} className="flex flex-1 gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre de archivo..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button type="submit">Buscar</Button>
      </form>
      <div className="flex gap-2">
        <Select value={statusFilter} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="processed">Procesadas</SelectItem>
            <SelectItem value="waiting_validation">Pendientes</SelectItem>
            <SelectItem value="processing">En proceso</SelectItem>
            <SelectItem value="failed">Fallidas</SelectItem>
            <SelectItem value="rejected">Rechazadas</SelectItem>
            <SelectItem value="duplicated">Duplicadas</SelectItem>
          </SelectContent>
        </Select>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={handleRefresh}
          title="Actualizar"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
