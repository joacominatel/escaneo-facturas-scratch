import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton"

export default function Loading() {
  return (
    <DashboardShell>
      <DashboardHeader
        heading="Historial de Facturas"
        text="Ver y administrar todas tus actividades de procesamiento de facturas"
      />
      <DashboardSkeleton />
    </DashboardShell>
  )
}
