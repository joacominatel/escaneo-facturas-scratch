"use client"

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from "recharts"
import { useInvoicesSummary } from "@/hooks/api"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { statusColors } from "@/lib/status-utils"

// Nombres legibles para los estados
const statusNames = {
  processed: "Procesadas",
  waiting_validation: "Pendientes",
  processing: "En proceso",
  failed: "Fallidas",
  rejected: "Rechazadas",
  duplicated: "Duplicadas",
}

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

  // Transformar los datos para el gráfico
  const chartData = summary
    ? Object.entries(summary).map(([key, value]) => ({
        name: statusNames[key as keyof typeof statusNames] || key,
        value,
        color: statusColors[key as keyof typeof statusColors]?.color || "#94a3b8", // Color por defecto
      }))
    : []

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-md">
                    <div className="grid grid-cols-2 gap-2">
                      <span className="font-medium">{payload[0].name}:</span>
                      <span className="font-bold">{payload[0].value}</span>
                    </div>
                  </div>
                )
              }
              return null
            }}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
