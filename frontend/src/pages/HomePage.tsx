import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileUploadArea } from "@/components/Home/file-upload-area"
import { RecentInvoices } from "@/components/Home/recent-invoices"
import { InvoiceStatusSummary } from "@/components/Home/invoice-status-summary"
import { UploadHistory } from "@/components/History/invoice-page"
import { useEffect, useState } from "react"
import type React from "react"
import { FileText, UploadCloud, CheckCircle, Clock, AlertTriangle, XCircle, BarChart3 } from "lucide-react"
import { useInvoicesSummary } from "@/hooks/api"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

// Definición de colores para los diferentes estados
const statusColors = {
  processed: {
    bg: "bg-green-100",
    text: "text-green-800",
    border: "border-green-200",
    icon: <CheckCircle className="h-5 w-5 text-green-500" />,
    description: "Facturas procesadas correctamente",
  },
  waiting_validation: {
    bg: "bg-amber-100",
    text: "text-amber-800",
    border: "border-amber-200",
    icon: <Clock className="h-5 w-5 text-amber-500" />,
    description: "Facturas pendientes de validación",
  },
  processing: {
    bg: "bg-blue-100",
    text: "text-blue-800",
    border: "border-blue-200",
    icon: <BarChart3 className="h-5 w-5 text-blue-500" />,
    description: "Facturas en procesamiento",
  },
  failed: {
    bg: "bg-red-100",
    text: "text-red-800",
    border: "border-red-200",
    icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
    description: "Facturas con errores de procesamiento",
  },
  rejected: {
    bg: "bg-pink-100",
    text: "text-pink-800",
    border: "border-pink-200",
    icon: <XCircle className="h-5 w-5 text-pink-500" />,
    description: "Facturas rechazadas manualmente",
  },
}

// Componente para mostrar un panel de estado
function StatusPanel({
  title,
  value,
  color,
  icon,
  description,
  isLoading,
}: {
  title: string
  value: number
  color: { bg: string; text: string; border: string }
  icon: React.ReactNode
  description: string
  isLoading: boolean
}) {
  if (isLoading) {
    return (
      <Card className={cn("border", color.border)}>
        <CardHeader className={cn("flex flex-row items-center justify-between space-y-0 pb-2", color.bg)}>
          <CardTitle className={cn("text-sm font-medium", color.text)}>
            <Skeleton className="h-4 w-24" />
          </CardTitle>
          <Skeleton className="h-5 w-5 rounded-full" />
        </CardHeader>
        <CardContent className="pt-4">
          <Skeleton className="h-8 w-12 mb-1" />
          <Skeleton className="h-3 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("border transition-all duration-300 hover:shadow-md", color.border)}>
      <CardHeader className={cn("flex flex-row items-center justify-between space-y-0 pb-2", color.bg)}>
        <CardTitle className={cn("text-sm font-medium", color.text)}>{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent className="pt-4">
        <div className={cn("text-2xl font-bold mb-1", color.text)}>{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

export default function HomePage() {
  const searchParams = new URLSearchParams(window.location.search)
  const tabParam = searchParams.get("tab")
  const [activeTab, setActiveTab] = useState("overview")
  const { summary, isLoading, refreshSummary } = useInvoicesSummary()

  // Calcular el total de facturas
  const totalInvoices = summary ? Object.values(summary).reduce((acc, count) => acc + count, 0) : 0

  // Sincronizar el tab activo con el parámetro de URL
  useEffect(() => {
    if (tabParam && ["overview", "upload", "history"].includes(tabParam)) {
      setActiveTab(tabParam)
    }
  }, [tabParam])

    // Actualizar el resumen cada 30 segundos
    useEffect(() => {
      const interval = setInterval(() => {
        refreshSummary()
      }, 30000)
  
      return () => clearInterval(interval)
    }, [refreshSummary])
  
    // Preparar los datos para los paneles
    const statusPanels = [
      {
        key: "total",
        title: "Total Facturas",
        value: totalInvoices,
        color: { bg: "bg-purple-100", text: "text-purple-800", border: "border-purple-200" },
        icon: <FileText className="h-5 w-5 text-purple-500" />,
        description: "Total de facturas en el sistema",
      },
      {
        key: "processed",
        title: "Procesadas",
        value: summary?.processed || 0,
        color: statusColors.processed.bg ? statusColors.processed : { bg: "", text: "", border: "" },
        icon: statusColors.processed.icon,
        description: statusColors.processed.description,
      },
      {
        key: "waiting_validation",
        title: "Pendientes",
        value: summary?.waiting_validation || 0,
        color: statusColors.waiting_validation.bg ? statusColors.waiting_validation : { bg: "", text: "", border: "" },
        icon: statusColors.waiting_validation.icon,
        description: statusColors.waiting_validation.description,
      },
      {
        key: "processing",
        title: "En Proceso",
        value: summary?.processing || 0,
        color: statusColors.processing.bg ? statusColors.processing : { bg: "", text: "", border: "" },
        icon: statusColors.processing.icon,
        description: statusColors.processing.description,
      },
    ]
  
    // Añadir paneles para failed y rejected solo si existen en el resumen
    if (summary?.failed) {
      statusPanels.push({
        key: "failed",
        title: "Fallidas",
        value: summary.failed,
        color: statusColors.failed.bg ? statusColors.failed : { bg: "", text: "", border: "" },
        icon: statusColors.failed.icon,
        description: statusColors.failed.description,
      })
    }
  
    if (summary?.rejected) {
      statusPanels.push({
        key: "rejected",
        title: "Rechazadas",
        value: summary.rejected,
        color: statusColors.rejected.bg ? statusColors.rejected : { bg: "", text: "", border: "" },
        icon: statusColors.rejected.icon,
        description: statusColors.rejected.description,
      })
    }  

  return (
    <div className="flex min-h-screen w-full flex-col">
      <main className="flex-1">
        <div className="grid items-start gap-6 pb-8 pt-6 md:py-8 px-6">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Escaneo de Facturas</h1>
              <p className="text-muted-foreground">Sube, procesa y gestiona tus facturas de forma automática.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-9">
                <FileText className="mr-2 h-4 w-4" />
                Ver Guía
              </Button>
              <Button size="sm" className="h-9" asChild={activeTab !== "upload"}>
                {activeTab === "upload" ? (
                  <span>
                    <UploadCloud className="mr-2 h-4 w-4" />
                    Subir Facturas
                  </span>
                ) : (
                  <a href="?tab=upload">
                    <UploadCloud className="mr-2 h-4 w-4" />
                    Subir Facturas
                  </a>
                )}
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value)} className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview" asChild>
                <a href="?tab=overview">Resumen</a>
              </TabsTrigger>
              <TabsTrigger value="upload" asChild>
                <a href="?tab=upload">Subir Facturas</a>
              </TabsTrigger>
              <TabsTrigger value="history" asChild>
                <a href="?tab=history">Historial</a>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {statusPanels.map((panel) => (
                  <StatusPanel
                    key={panel.key}
                    title={panel.title}
                    value={panel.value}
                    color={panel.color}
                    icon={panel.icon}
                    description={panel.description}
                    isLoading={isLoading}
                  />
                ))}
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                  <CardHeader>
                    <CardTitle>Estado de Facturas</CardTitle>
                    <CardDescription>Distribución de facturas por estado de procesamiento</CardDescription>
                  </CardHeader>
                  <CardContent className="pl-2">
                    <InvoiceStatusSummary />
                  </CardContent>
                </Card>
                <Card className="col-span-3">
                  <CardHeader>
                    <CardTitle>Facturas Recientes</CardTitle>
                    <CardDescription>Últimas facturas procesadas en el sistema</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RecentInvoices />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="upload" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Subir Facturas</CardTitle>
                  <CardDescription>Sube archivos PDF o ZIP con facturas para procesamiento automático</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FileUploadArea />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <UploadHistory />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
