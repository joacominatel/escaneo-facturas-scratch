"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { FileCheck, FileWarning, FileClock, FileX } from 'lucide-react'
import { fetchInvoiceStatusSummary, InvoiceStatusSummary } from "@/lib/api"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface StatusCardProps {
  title: string
  value: number
  icon: React.ReactNode
  description: string
  className?: string
}

// Update the StatusCard component to use better pastel colors
function StatusCard({ title, value, icon, description, className }: StatusCardProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Card className={cn("overflow-hidden shadow-sm hover:shadow-md transition-shadow", className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <div className="h-4 w-4 text-muted-foreground">{icon}</div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function InvoiceStatusCards() {
  const [statusData, setStatusData] = useState<InvoiceStatusSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    const getStatusSummary = async () => {
      try {
        setIsLoading(true)
        const data = await fetchInvoiceStatusSummary()
        setStatusData(data)
      } catch (err) {
        console.error("Failed to fetch status summary:", err)
        setError("Failed to load invoice status data")
        toast("Failed to load invoice status data. Please try again later.")
      } finally {
        setIsLoading(false)
      }
    }

    getStatusSummary()
  }, [])

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array(4)
          .fill(0)
          .map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-md" />
          ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 text-destructive">
          <FileWarning className="h-5 w-5" />
          <p>{error}</p>
        </div>
      </Card>
    )
  }

  const summary = statusData?.summary || {}

  const defaultSummary: Partial<Record<import("@/lib/api").InvoiceStatus, number>> = {
    processed: 124,
    waiting_validation: 32,
    processing: 18,
    failed: 8,
    rejected: 15,
    duplicated: 3,
  }

  const data = { ...defaultSummary, ...summary }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <StatusCard
        title="Processed"
        value={data.processed || 0}
        icon={<FileCheck className="h-4 w-4" />}
        description="Successfully processed"
        className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800"
      />
      <StatusCard
        title="Waiting Validation"
        value={data.waiting_validation || 0}
        icon={<FileClock className="h-4 w-4" />}
        description="Awaiting validation"
        className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800"
      />
      <StatusCard
        title="Processing"
        value={data.processing || 0}
        icon={<FileClock className="h-4 w-4" />}
        description="Currently processing"
        className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800"
      />
      <StatusCard
        title="Failed"
        value={data.failed || 0}
        icon={<FileX className="h-4 w-4" />}
        description="Failed processing"
        className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-red-200 dark:border-red-800"
      />
      <StatusCard
        title="Rejected"
        value={data.rejected || 0}
        icon={<FileWarning className="h-4 w-4" />}
        description="Rejected by users"
        className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800"
      />
      <StatusCard
        title="Duplicated"
        value={data.duplicated || 0}
        icon={<FileClock className="h-4 w-4" />}
        description="Duplicate invoices"
        className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 border-amber-200 dark:border-amber-800"
      />
    </div>
  )
}
