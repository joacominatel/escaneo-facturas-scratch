"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowUpRight, CheckCircle, Clock, RefreshCw, XCircle } from "lucide-react"
import { useInvoicesList } from "@/hooks/api"
import { Skeleton } from "@/components/ui/skeleton"
import { useEffect } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

type InvoiceStatus = "processed" | "waiting_validation" | "processing" | "failed" | "rejected"

export function RecentInvoices() {
  const { invoices, isLoading, error, updateParams, refreshInvoices } = useInvoicesList({
    per_page: 5,
  })

  useEffect(() => {
    // Actualizar cada 30 segundos
    const interval = setInterval(() => {
      updateParams({ per_page: 5 })
    }, 30000)

    return () => clearInterval(interval)
  }, [updateParams])

  const getStatusIcon = (status: InvoiceStatus) => {
    switch (status) {
      case "processed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "waiting_validation":
      case "processing":
        return <Clock className="h-4 w-4 text-amber-500" />
      case "failed":
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-amber-500" />
    }
  }

  const getStatusBadge = (status: InvoiceStatus) => {
    switch (status) {
      case "processed":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Procesada
          </Badge>
        )
      case "waiting_validation":
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            Pendiente
          </Badge>
        )
      case "processing":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            En proceso
          </Badge>
        )
      case "failed":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Fallida
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Rechazada
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            Desconocido
          </Badge>
        )
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className="h-auto">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error al cargar facturas recientes</AlertTitle>
        <AlertDescription className="flex flex-col gap-2">
          <p>{error}</p>
          <Button variant="outline" size="sm" className="w-fit mt-2" onClick={() => refreshInvoices()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reintentar
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  if (!invoices.length) {
    return (
      <div className="flex flex-col items-center justify-center h-[200px] gap-4">
        <p className="text-muted-foreground">No hay facturas recientes</p>
        <Button variant="outline" size="sm" onClick={() => refreshInvoices()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {invoices.map((invoice) => (
          <div key={invoice.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
            <div className="flex items-center space-x-3">
              {getStatusIcon(invoice.status as InvoiceStatus)}
              <div>
                <p className="text-sm font-medium">{invoice.filename}</p>
                <p className="text-xs text-muted-foreground">{new Date(invoice.created_at).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <div className="mt-1">{getStatusBadge(invoice.status as InvoiceStatus)}</div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-center">
        <Button variant="outline" size="sm" className="w-full">
          Ver todas las facturas
        </Button>
      </div>
    </div>
  )
}
