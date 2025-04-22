"use client"

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { useInvoicesSummary } from "@/hooks/api"
import { Skeleton } from "@/components/ui/skeleton"

export function InvoiceStatusSummary() {
  const { summary, isLoading, error } = useInvoicesSummary()

  if (isLoading) {
    return <Skeleton className="h-[300px] w-full" />
  }

  if (error || !summary) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <p className="text-muted-foreground">Error al cargar el resumen de facturas</p>
      </div>
    )
  }

  const data = [
    {
      name: "Procesadas",
      total: summary.processed,
      color: "#16a34a",
    },
    {
      name: "Pendientes",
      total: summary.waiting_validation,
      color: "#f59e0b",
    },
    {
      name: "En proceso",
      total: summary.processing,
      color: "#3b82f6",
    },
    {
      name: "Fallidas",
      total: summary.failed,
      color: "#dc2626",
    },
    {
      name: "Rechazadas",
      total: summary.rejected,
      color: "#9f1239",
    },
  ]

  return (
    <ChartContainer
      config={{
        total: {
          label: "Facturas",
          color: "var(--color)",
        },
      }}
      className="h-[300px]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" />
          <YAxis />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="total" radius={[4, 4, 0, 0]} className="fill-primary" fill="var(--color)" />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
