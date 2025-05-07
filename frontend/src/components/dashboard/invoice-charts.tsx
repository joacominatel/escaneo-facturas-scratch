"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent
} from "@/components/ui/chart"
import { PieChart, Pie, Cell, /* Legend, */ ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip } from "recharts"
import { fetchInvoiceChartData, InvoiceStatusSummary, InvoiceStatus, fetchInvoiceTrends, InvoiceTrendsResponse, InvoiceTrendPoint, FetchInvoiceTrendsOptions } from "@/lib/api"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"


interface InvoiceChartsProps {
  className?: string
}

interface StatusPieDataPoint {
  name: string
  value: number
  fill: string
  status: InvoiceStatus
}

const statusConfig: Record<InvoiceStatus | string, { label: string; color: string }> = {
  processed: { label: "Procesadas", color: "hsl(142, 71%, 44%)" },
  waiting_validation: { label: "Esperando Validación", color: "hsl(199, 89%, 46%)" },
  processing: { label: "Procesando", color: "hsl(262, 83%, 56%)" },
  failed: { label: "Falladas", color: "hsl(0, 74%, 52%)" },
  rejected: { label: "Rechazadas", color: "hsl(31, 90%, 55%)" },
  duplicated: { label: "Duplicadas", color: "hsl(45, 93%, 48%)" },
  pending_processing: { label: "Pendientes de Procesamiento", color: "hsl(51 100% 75.4%)" },
}

const DEFAULT_TREND_DAYS = 7;
const TREND_STATUS_TO_FETCH: InvoiceStatus = "processed";

export function InvoiceCharts({ className }: InvoiceChartsProps) {
  // Estado para el gráfico de tarta (distribución de estados)
  const [pieChartData, setPieChartData] = useState<StatusPieDataPoint[]>([]);
  const [isPieLoading, setIsPieLoading] = useState(true);
  const [pieStartDate, setPieStartDate] = useState<string>("");
  const [pieEndDate, setPieEndDate] = useState<string>("");

  // Estado para el gráfico de líneas (tendencias)
  const [lineChartData, setLineChartData] = useState<InvoiceTrendPoint[]>([]);
  const [isLineLoading, setIsLineLoading] = useState(true);
  const [selectedTrendDays, setSelectedTrendDays] = useState<number>(DEFAULT_TREND_DAYS);
  const [trendStatusLabel, setTrendStatusLabel] = useState<string>(statusConfig[TREND_STATUS_TO_FETCH]?.label || TREND_STATUS_TO_FETCH);

  // Efecto para cargar datos del gráfico de tarta
  useEffect(() => {
    const getPieChartData = async () => {
      try {
        setIsPieLoading(true);
        const summaryData: InvoiceStatusSummary = await fetchInvoiceChartData({ startDate: pieStartDate, endDate: pieEndDate });
        
        const transformedData = Object.entries(summaryData.summary)
          .map(([status, count]) => {
            const config = statusConfig[status as InvoiceStatus];
            return {
              name: config?.label || status,
              value: count || 0,
              fill: config?.color || '#ccc',
              status: status as InvoiceStatus,
            };
          })
          .filter(item => item.value > 0)
          .sort((a, b) => a.status.localeCompare(b.status));
        setPieChartData(transformedData);
      } catch (err) {
        console.error("Failed to fetch pie chart data:", err);
        toast.error("Error al cargar datos de distribución. Mostrando gráfico vacío.");
        setPieChartData([]);
      } finally {
        setIsPieLoading(false);
      }
    };
    getPieChartData();
  }, [pieStartDate, pieEndDate]);

  // Efecto para cargar datos del gráfico de líneas
  useEffect(() => {
    const getLineChartData = async () => {
      try {
        setIsLineLoading(true);
        const options: FetchInvoiceTrendsOptions = { days_ago: selectedTrendDays, status: TREND_STATUS_TO_FETCH };
        const trendsData: InvoiceTrendsResponse = await fetchInvoiceTrends(options);
        setLineChartData(trendsData.trend_data);
        setTrendStatusLabel(statusConfig[trendsData.status_queried]?.label || trendsData.status_queried)
      } catch (err) {
        console.error("Failed to fetch line chart data:", err);
        toast.error("Error al cargar datos de tendencias. Mostrando gráfico vacío.");
        setLineChartData([]);
      } finally {
        setIsLineLoading(false);
      }
    };
    getLineChartData();
  }, [selectedTrendDays]);

  const handleClearPieFilters = () => {
    setPieStartDate("");
    setPieEndDate("");
  };

  const lineChartConfig = useMemo(() => ({
    [trendStatusLabel]: {
      label: trendStatusLabel,
      color: statusConfig[TREND_STATUS_TO_FETCH]?.color || "hsl(var(--chart-1))",
    },
  }), [trendStatusLabel]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className={cn("", className)}
    >
      <Card className="h-full flex flex-col border border-purple-200 dark:border-purple-700/50 shadow-lg bg-white/80 dark:bg-slate-900/70 backdrop-blur-sm">
        <Tabs defaultValue="distribution" className="flex flex-col h-full">
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
              <div>
                 <CardTitle>Analíticas de Facturas</CardTitle>
                 <CardDescription>Visualiza la distribución y tendencias de tus facturas.</CardDescription>
              </div>
              <TabsList className="mt-2 sm:mt-0">
                <TabsTrigger value="distribution">Distribución</TabsTrigger>
                <TabsTrigger value="trends">Tendencias ({trendStatusLabel})</TabsTrigger>
              </TabsList>
            </div>
          </CardHeader>
          
          <TabsContent value="distribution" className="flex-1 flex flex-col">
            <div className="px-6 pt-4 pb-2 flex flex-col sm:flex-row gap-2 items-center border-b dark:border-slate-700">
              <div className="flex flex-col gap-1 w-full sm:w-auto">
                <Label htmlFor="start-date" className="text-xs">Desde</Label>
                <Input 
                  type="date" 
                  id="start-date"
                  value={pieStartDate} 
                  onChange={(e) => setPieStartDate(e.target.value)} 
                  className="h-8 text-sm"
                />
              </div>
              <div className="flex flex-col gap-1 w-full sm:w-auto">
                <Label htmlFor="end-date" className="text-xs">Hasta</Label>
                <Input 
                  type="date" 
                  id="end-date"
                  value={pieEndDate} 
                  onChange={(e) => setPieEndDate(e.target.value)} 
                  className="h-8 text-sm"
                />
              </div>
              <Button onClick={handleClearPieFilters} variant="outline" size="sm" className="h-8 mt-auto sm:mt-1 self-start sm:self-auto">Limpiar</Button>
            </div>
            <CardContent className="flex-1 pb-0 mt-4">
              {isPieLoading ? (
                <div className="flex h-full items-center justify-center min-h-[300px]">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                </div>
              ) : pieChartData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-muted-foreground min-h-[300px]">
                  No hay datos de estado disponibles para el periodo seleccionado.
                </div>
              ) : (
                <ChartContainer config={statusConfig} className="h-full w-full min-h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <ChartTooltip 
                        cursor={false}
                        content={<ChartTooltipContent hideLabel nameKey="name" />} 
                      />
                      <Pie
                        data={pieChartData}
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
                        {pieChartData.map((entry) => (
                          <Cell key={`cell-${entry.status}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <ChartLegend content={<ChartLegendContent nameKey="name" />} verticalAlign="bottom" height={36} wrapperStyle={{ paddingBottom: '10px'}} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
            </CardContent>
          </TabsContent>

          <TabsContent value="trends" className="flex-1 flex flex-col">
            <div className="px-6 pt-4 pb-2 flex flex-col sm:flex-row gap-2 items-center justify-start border-b dark:border-slate-700">
                <Label className="text-xs whitespace-nowrap mr-2">Mostrar últimos:</Label>
                <Select value={String(selectedTrendDays)} onValueChange={(value) => setSelectedTrendDays(Number(value))}>
                    <SelectTrigger className="h-8 w-[120px] text-xs">
                        <SelectValue placeholder="Seleccionar período" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="7">7 días</SelectItem>
                        <SelectItem value="15">15 días</SelectItem>
                        <SelectItem value="30">30 días</SelectItem>
                        <SelectItem value="90">90 días</SelectItem>
                    </SelectContent>
                </Select>
                <span className="text-xs text-muted-foreground ml-2">(Facturas {trendStatusLabel.toLowerCase()})</span>
            </div>
            <CardContent className="flex-1 pb-0 mt-4">
              {isLineLoading ? (
                <div className="flex h-full items-center justify-center min-h-[300px]">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                </div>
              ) : lineChartData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-muted-foreground min-h-[300px]">
                  No hay datos de tendencias disponibles para el período y estado seleccionados.
                </div>
              ) : (
                <ChartContainer config={lineChartConfig} className="h-full w-full min-h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={lineChartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(tick) => new Date(tick + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short'})} // Ajustar T00:00:00 para evitar problemas de zona horaria al parsear solo fecha
                        tickLine={false}
                        axisLine={false}
                        padding={{ left: 10, right: 10 }}
                      />
                      <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={30}/>
                      <ChartTooltip 
                        cursor={true} 
                        content={<ChartTooltipContent indicator="line" />} 
                      />
                       <Line 
                        dataKey="count" 
                        type="monotone" 
                        stroke={statusConfig[TREND_STATUS_TO_FETCH]?.color || "var(--color-count)"} 
                        strokeWidth={2} 
                        dot={true}
                        name={trendStatusLabel}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
            </CardContent>
          </TabsContent>
        </Tabs>
      </Card>
    </motion.div>
  )
}
