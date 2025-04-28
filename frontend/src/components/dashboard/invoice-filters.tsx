"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePickerWithRange } from "@/components/date-picker-with-range"
import type { DateRange } from "react-day-picker"
import { Filter, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
// Import types for filters
import { InvoiceStatus, FetchInvoiceHistoryOptions } from "@/lib/api"

// Define the state structure for filters, closely matching FetchInvoiceHistoryOptions
interface FilterState {
  status: InvoiceStatus | "" // Use empty string for "All"
  search: string
  dateRange?: DateRange // Make dateRange optional to match react-day-picker type
}

// Define available statuses for the dropdown
const availableStatuses: { value: InvoiceStatus | ""; label: string }[] = [
  { value: "", label: "All Statuses" },
  { value: "processed", label: "Processed" },
  { value: "waiting_validation", label: "Waiting Validation" },
  { value: "processing", label: "Processing" },
  { value: "failed", label: "Failed" },
  { value: "rejected", label: "Rejected" },
  { value: "duplicated", label: "Duplicated" },
]

// Prop type for when the component needs to notify parent about filter changes
interface InvoiceFiltersProps {
  onFiltersApply?: (appliedFilters: FetchInvoiceHistoryOptions) => void
}

export function InvoiceFilters({ onFiltersApply }: InvoiceFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [filters, setFilters] = useState<FilterState>({
    status: "",
    search: "",
    dateRange: undefined // Initialize as undefined
  })

  // Check if any filter is active (excluding default empty values)
  const isAnyFilterActive = 
    filters.status !== "" || 
    filters.search !== "" || 
    filters.dateRange?.from !== undefined // Use optional chaining

  const handleReset = () => {
    const defaultFilters: FilterState = {
      status: "",
      search: "",
      dateRange: undefined,
    }
    setFilters(defaultFilters)
    // Optionally notify parent immediately on reset
    if (onFiltersApply) {
       const apiOptions: FetchInvoiceHistoryOptions = {
         status: undefined, 
         search: undefined,
         // dateFrom: undefined,
         // dateTo: undefined,
       }
      onFiltersApply(apiOptions)
    }
  }

  const handleApply = () => {
    // Construct the options object for the API call
    const apiOptions: FetchInvoiceHistoryOptions = {
      status: filters.status === "" ? undefined : filters.status,
      search: filters.search || undefined,
      // Map dates to string format if API requires it (e.g., ISO string)
      // dateFrom: filters.dateRange?.from?.toISOString(), // Use optional chaining
      // dateTo: filters.dateRange?.to?.toISOString(), // Use optional chaining
    }
    console.log("Applying filters:", apiOptions)
    if (onFiltersApply) {
      onFiltersApply(apiOptions)
    }
    setIsExpanded(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          {isExpanded ? "Hide Filters" : "Show Filters"}
        </Button>

        {isAnyFilterActive && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="flex items-center gap-2 text-muted-foreground hover:text-destructive"
          >
            <X className="h-4 w-4" />
            Reset Filters
          </Button>
        )}
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
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="grid gap-2">
                    <Label htmlFor="status">Status</Label>
                    <Select 
                      value={filters.status}
                      onValueChange={(value) => setFilters({ ...filters, status: value as InvoiceStatus | "" })}
                    >
                      <SelectTrigger id="status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableStatuses.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="search">Search</Label>
                    <Input
                      id="search"
                      placeholder="Search by filename, etc..."
                      value={filters.search}
                      onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>Date Range</Label> { /* Note: Date range filtering not yet implemented in fetchInvoiceHistory */ }
                    <DatePickerWithRange
                      date={filters.dateRange}
                      setDate={(range) => 
                        setFilters({ 
                          ...filters, 
                          dateRange: range // Pass the DateRange object directly
                        })
                      }
                    />
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
