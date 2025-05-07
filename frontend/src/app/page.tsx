"use client"
import { Suspense, useEffect, useState } from "react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { InvoiceCharts } from "@/components/dashboard/invoice-charts"
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton"
import RecentInvoices from "@/components/dashboard/recent-invoices/recent-invoices"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { fetchInvoiceChartData, fetchInvoiceTrends, InvoiceStatus, InvoiceTrendPoint } from "@/lib/api"
import { AlertTriangle, CheckCircle2, FileClock } from "lucide-react"

interface KPIValue {
  value: number | string;
  label: string;
  icon?: React.ReactNode;
  description?: string;
}

export default function DashboardPage() {
  const [kpiData, setKpiData] = useState<KPIValue[]>([]);
  const [kpiLoading, setKpiLoading] = useState(true);

  useEffect(() => {
    async function loadKpis() {
      setKpiLoading(true);
      try {
        // 1. Pendientes de Validación (total)
        const summaryData = await fetchInvoiceChartData(); // Sin filtros de fecha para obtener el total general
        const pendingValidation = summaryData.summary.waiting_validation || 0;

        // 2. Procesadas (Últimos 7 días)
        const processedTrends = await fetchInvoiceTrends({ days_ago: 7, status: "processed" });
        const totalProcessedLast7Days = processedTrends.trend_data.reduce((sum, item) => sum + item.count, 0);

        // 3. Fallidas (Hoy)
        const failedTodayTrends = await fetchInvoiceTrends({ days_ago: 1, status: "failed" });
        const totalFailedToday = failedTodayTrends.trend_data.reduce((sum, item) => sum + item.count, 0);
        
        // 4. Recibidas Hoy (Opcional - requiere que "trends" devuelva todas si no hay status, o un nuevo endpoint)
        // Por ahora, vamos a simularlo o dejarlo pendiente.
        // const receivedTodayTrends = await fetchInvoiceTrends({ days_ago: 1 }); // Asumiendo que esto devolvería todas
        // const totalReceivedToday = receivedTodayTrends.trend_data.reduce((sum, item) => sum + item.count, 0);

        setKpiData([
          {
            value: pendingValidation,
            label: "Pendientes Validación",
            icon: <FileClock className="h-5 w-5 text-blue-500" />,
            description: "Facturas esperando revisión manual."
          },
          {
            value: totalProcessedLast7Days,
            label: "Procesadas (7 días)",
            icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
            description: "Facturas procesadas exitosamente."
          },
          {
            value: totalFailedToday,
            label: "Fallidas (Hoy)",
            icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
            description: "Facturas con errores hoy."
          },
          // Agrega más KPIs aquí si es necesario
        ]);
      } catch (error) {
        console.error("Error loading KPI data:", error);
        // Puedes poner un estado de error para los KPIs aquí
      } finally {
        setKpiLoading(false);
      }
    }
    loadKpis();
  }, []);

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8 bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto w-full max-w-screen-2xl">
        <DashboardShell>
          <DashboardHeader heading="Dashboard de Facturas" text="Monitoriza y administra tu flujo de procesamiento de facturas." />
          
          {/* Sección de KPIs */}
          {kpiLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
              {[1, 2, 3].map(i => (
                <Card key={i} className="shadow-md">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium h-5 bg-slate-200 dark:bg-slate-700 rounded w-3/4 animate-pulse"></CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/2 animate-pulse mb-2"></div>
                    <p className="text-xs text-muted-foreground h-4 bg-slate-200 dark:bg-slate-700 rounded w-full animate-pulse"></p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : kpiData.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
              {kpiData.map((kpi, index) => (
                <Card key={index} className="shadow-md hover:shadow-lg transition-shadow duration-300 border-l-4"
                  style={{ borderLeftColor: 
                    kpi.label.includes("Validación") ? 'hsl(199, 89%, 46%)' : 
                    kpi.label.includes("Procesadas") ? 'hsl(142, 71%, 44%)' : 
                    kpi.label.includes("Fallidas") ? 'hsl(0, 74%, 52%)' : 'hsl(var(--border))'
                  }}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{kpi.label}</CardTitle>
                    {kpi.icon}
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{kpi.value}</div>
                    {kpi.description && (
                      <p className="text-xs text-muted-foreground pt-1">{kpi.description}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Sección Principal de Gráficos y Facturas Recientes */}
          <Suspense fallback={<DashboardSkeleton />}>
            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-7">
              <InvoiceCharts className="lg:col-span-4" />
              <div className="lg:col-span-3">
                <RecentInvoices />
              </div>
            </div>
          </Suspense>
        </DashboardShell>
      </div>
    </div>
  )
}
