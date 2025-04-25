"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePickerWithRange } from "@/components/date-picker-with-range"
import { Filter, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export function InvoiceFilters() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [filters, setFilters] = useState<{
    status: string
    search: string
    dateRange: { from: Date | undefined; to: Date | undefined }
  }>({
    status: "",
    search: "",
    dateRange: {
      from: undefined,
      to: undefined,
    },
  })

  const handleReset = () => {
    setFilters({
      status: "",
      search: "",
      dateRange: {
        from: undefined,
        to: undefined,
      },
    })
  }

  const handleApply = () => {
    // Here you would typically trigger a data fetch with the filters
    console.log("Applied filters:", filters)
    // For demo purposes, we'll just collapse the filter panel
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

        {Object.values(filters).some((val) => val && (typeof val === "string" ? val.length > 0 : true)) && (
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
                    <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                      <SelectTrigger id="status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="processed">Processed</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="search">Search</Label>
                    <Input
                      id="search"
                      placeholder="Search by invoice number, vendor..."
                      value={filters.search}
                      onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>Date Range</Label>
                    <DatePickerWithRange
                      date={filters.dateRange}
                      setDate={(range) => setFilters({ ...filters, dateRange: { from: range?.from, to: range?.to ?? undefined } })}
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
