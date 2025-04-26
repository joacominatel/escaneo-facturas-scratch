import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton"

export default function Loading() {
  return (
    <DashboardShell>
      <DashboardHeader
        heading="Invoice History"
        text="View and manage all your invoice processing activities"
      />
      <DashboardSkeleton />
    </DashboardShell>
  )
}
