"use client"

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { useInvoicesSummary } from "@/hooks/api"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export function InvoiceStatusSummary() {
  const { summary, isLoading, error, refreshSummary } = useInvoicesSummary()

  if (isLoading) {
    return <Skeleton className="h-[300px] w-full" />
  }

  if (error) {
    return (
      <Alert variant="destructive" className="h-auto">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error al cargar el resumen</AlertTitle>
        <AlertDescription className="flex flex-col gap-2">
          <p>{error}</p>
          <Button variant="outline" size="sm" className="w-fit mt-2" onClick={() => refreshSummary()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reintentar
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  // Provide default values if summary is null
  const safeData = [
    {
      name: "Procesadas",
      total: summary?.processed || 0,
      color: "#16a34a",
    },
    {
      name: "Pendientes",
      total: summary?.waiting_validation || 0,
      color: "#f59e0b",
    },
    {
      name: "En proceso",
      total: summary?.processing || 0,
      color: "#3b82f6",
    },
    {
      name: "Fallidas",
      total: summary?.failed || 0,
      color: "#dc2626",
    },
    {
      name: "Rechazadas",
      total: summary?.rejected || 0,
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
        <BarChart data={safeData}>
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
