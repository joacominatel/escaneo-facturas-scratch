"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { FileCheck, FileWarning, FileClock, FileX } from "lucide-react"
import { fetchInvoiceStatusSummary } from "@/lib/api"
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

function StatusCard({ title, value, icon, description, className }: StatusCardProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Card className={cn("overflow-hidden", className)}>
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
  const [statusData, setStatusData] = useState<Record<string, number> | null>(null)
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
  }, [toast])

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

  // Fallback data in case the API fails
  const data = statusData || {
    processed: 124,
    pending: 42,
    failed: 8,
    rejected: 15,
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatusCard
        title="Processed"
        value={data.processed || 0}
        icon={<FileCheck className="h-4 w-4" />}
        description="Successfully processed invoices"
        className="border-l-4 border-l-green-500"
      />
      <StatusCard
        title="Pending"
        value={data.pending || 0}
        icon={<FileClock className="h-4 w-4" />}
        description="Invoices awaiting processing"
        className="border-l-4 border-l-yellow-500"
      />
      <StatusCard
        title="Failed"
        value={data.failed || 0}
        icon={<FileX className="h-4 w-4" />}
        description="Failed processing attempts"
        className="border-l-4 border-l-red-500"
      />
      <StatusCard
        title="Rejected"
        value={data.rejected || 0}
        icon={<FileWarning className="h-4 w-4" />}
        description="Rejected by users"
        className="border-l-4 border-l-orange-500"
      />
    </div>
  )
}
