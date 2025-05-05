"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { PieChart, Pie, Cell, Legend, ResponsiveContainer } from "recharts"
import { fetchInvoiceChartData, InvoiceStatusSummary, InvoiceStatus } from "@/lib/api"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface InvoiceChartsProps {
  className?: string
}

interface StatusPieDataPoint {
  name: string
  value: number
  fill: string
  status: InvoiceStatus
}

const statusConfig: Record<InvoiceStatus, { label: string; color: string }> = {
  processed: { label: "Procesadas", color: "hsl(142, 71%, 44%)" },
  waiting_validation: { label: "Esperando Validación", color: "hsl(199, 89%, 46%)" },
  processing: { label: "Procesando", color: "hsl(262, 83%, 56%)" },
  failed: { label: "Falladas", color: "hsl(0, 74%, 52%)" },
  rejected: { label: "Rechazadas", color: "hsl(31, 90%, 55%)" },
  duplicated: { label: "Duplicadas", color: "hsl(45, 93%, 48%)" },
  pending_processing: { label: "Pendientes de Procesamiento", color: "hsl(262, 83%, 56%)" },
}

export function InvoiceCharts({ className }: InvoiceChartsProps) {
  const [chartData, setChartData] = useState<StatusPieDataPoint[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const getChartData = async () => {
      try {
        setIsLoading(true)
        const summaryData: InvoiceStatusSummary = await fetchInvoiceChartData()
        
        const transformedData = Object.entries(summaryData.summary)
          .map(([status, count]) => {
            const config = statusConfig[status as InvoiceStatus]
            return {
              name: config?.label || status,
              value: count || 0,
              fill: config?.color || '#ccc',
              status: status as InvoiceStatus,
            }
          })
          .filter(item => item.value > 0)
          .sort((a, b) => a.status.localeCompare(b.status))

        setChartData(transformedData)

      } catch (err) {
        console.error("Failed to fetch chart data:", err)
        toast("Error al cargar los datos del gráfico. Mostrando gráfico vacío.")
        setChartData([])
      } finally {
        setIsLoading(false)
      }
    }

    getChartData()
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className={cn("", className)}
    >
      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle>Distribución de Estados de Facturas</CardTitle>
          <CardDescription>Desglose actual de facturas por estado</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-0">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              No hay datos de estado disponibles.
            </div>
           ) : (
            <ChartContainer config={statusConfig} className="h-full w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <ChartTooltip 
                     cursor={false}
                     content={<ChartTooltipContent hideLabel nameKey="name" />} 
                   />
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    innerRadius={60}
                    paddingAngle={2}
                    labelLine={false}
                    label={({ percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}
                  >
                    {chartData.map((entry) => (
                      <Cell key={`cell-${entry.status}`} fill={entry.fill} />
                    ))}
                  </Pie>
                   <Legend 
                     verticalAlign="bottom" 
                     height={36} 
                     wrapperStyle={{ paddingBottom: '10px'}} 
                   />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
