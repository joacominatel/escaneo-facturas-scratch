"use client"

import { useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusPanel } from "@/components/Home/status-panel"
import { InvoiceStatusSummary } from "@/components/Home/invoice-status-summary"
import { RecentInvoices } from "@/components/Home/recent-invoices"
import { useStatusPanels } from "@/hooks/useStatusPanels"

export function Dashboard() {
  const { statusPanels, isLoading, refreshSummary } = useStatusPanels()

  // Update summary every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshSummary()
    }, 30000)

    return () => clearInterval(interval)
  }, [refreshSummary])

  return (
    <div className="space-y-4">
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
    </div>
  )
}