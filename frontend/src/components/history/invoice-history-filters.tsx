"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Filter, X, Calendar, SearchIcon } from 'lucide-react'
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format } from "date-fns"
import { InvoiceHistoryFilters as InvoiceHistoryFiltersType } from "@/app/history/page"

interface InvoiceHistoryFiltersProps {
  filters: InvoiceHistoryFiltersType
  onFilterChange: (filters: InvoiceHistoryFiltersType) => void
}

export function InvoiceHistoryFilters({ filters, onFilterChange }: InvoiceHistoryFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [localFilters, setLocalFilters] = useState<InvoiceHistoryFiltersType>(filters)
  const [dateFromOpen, setDateFromOpen] = useState(false)
  const [dateToOpen, setDateToOpen] = useState(false)

  // Parse dates from string to Date objects
  const dateFrom = localFilters.dateFrom ? new Date(localFilters.dateFrom) : undefined
  const dateTo = localFilters.dateTo ? new Date(localFilters.dateTo) : undefined

  const handleReset = () => {
    const resetFilters = {
      status: undefined,
      search: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      sortBy: "created_at",
      sortOrder: "desc" as const
    }
    setLocalFilters(resetFilters)
    onFilterChange(resetFilters)
  }

  const handleApply = () => {
    onFilterChange(localFilters)
    setIsExpanded(false)
  }

  const handleSearchChange = (value: string) => {
    setLocalFilters(prev => ({ ...prev, search: value }))
    // Apply search filter immediately
    if (value === "" || value.length >= 3) {
      onFilterChange({ ...localFilters, search: value })
    }
  }

  const hasActiveFilters = 
    !!localFilters.status || 
    !!localFilters.search || 
    !!localFilters.dateFrom || 
    !!localFilters.dateTo ||
    (localFilters.sortBy !== "created_at" || localFilters.sortOrder !== "desc")

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-xs">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search invoices..."
            value={localFilters.search || ""}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9 pr-10"
          />
          {localFilters.search && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 rounded-full"
              onClick={() => handleSearchChange("")}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Clear search</span>
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            {isExpanded ? "Hide Filters" : "Show Filters"}
          </Button>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="flex items-center gap-2 text-muted-foreground"
            >
              <X className="h-4 w-4" />
              Reset Filters
            </Button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <Card>
              <CardContent className="p-4">
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="grid gap-2">
                    <Label htmlFor="status">Status</Label>
                    <Select 
                      value={localFilters.status || ""} 
                      onValueChange={(value) => setLocalFilters({ ...localFilters, status: value || undefined })}
                    >
                      <SelectTrigger id="status">
                        <SelectValue placeholder="All statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All statuses</SelectItem>
                        <SelectItem value="processed">Processed</SelectItem>
                        <SelectItem value="waiting_validation">Waiting Validation</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="duplicated">Duplicated</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label>From Date</Label>
                    <Popover open={dateFromOpen} onOpenChange={setDateFromOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !dateFrom && "text-muted-foreground"
                          )}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {dateFrom ? format(dateFrom, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent
                          mode="single"
                          selected={dateFrom}
                          onSelect={(date) => {
                            setLocalFilters({
                              ...localFilters,
                              dateFrom: date ? date.toISOString() : undefined
                            })
                            setDateFromOpen(false)
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="grid gap-2">
                    <Label>To Date</Label>
                    <Popover open={dateToOpen} onOpenChange={setDateToOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !dateTo && "text-muted-foreground"
                          )}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {dateTo ? format(dateTo, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent
                          mode="single"
                          selected={dateTo}
                          onSelect={(date) => {
                            setLocalFilters({
                              ...localFilters,
                              dateTo: date ? date.toISOString() : undefined
                            })
                            setDateToOpen(false)
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="sort">Sort By</Label>
                    <Select 
                      value={`${localFilters.sortBy || "created_at"}-${localFilters.sortOrder || "desc"}`}
                      onValueChange={(value) => {
                        const [sortBy, sortOrder] = value.split("-") as [string, "asc" | "desc"]
                        setLocalFilters({ ...localFilters, sortBy, sortOrder })
                      }}
                    >
                      <SelectTrigger id="sort">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="created_at-desc">Date (Newest first)</SelectItem>
                        <SelectItem value="created_at-asc">Date (Oldest first)</SelectItem>
                        <SelectItem value="filename-asc">Filename (A-Z)</SelectItem>
                        <SelectItem value="filename-desc">Filename (Z-A)</SelectItem>
                        <SelectItem value="status-asc">Status (A-Z)</SelectItem>
                        <SelectItem value="status-desc">Status (Z-A)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="mt-4 flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsExpanded(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleApply}>Apply Filters</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
