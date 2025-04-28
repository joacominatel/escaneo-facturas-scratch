import { Suspense } from "react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { InvoiceStatusCards } from "@/components/dashboard/invoice-status-cards"
import { InvoiceCharts } from "@/components/dashboard/invoice-charts"
import { InvoiceFilters } from "@/components/dashboard/invoice-filters"
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton"
// Add recent invoices

export default function DashboardPage() {
  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <div className="mx-auto p-4 md:p-6 lg:p-8 w-full">
        <DashboardShell>
          <DashboardHeader heading="Invoice Dashboard" text="Monitor and manage your invoice processing workflow." />
          <Suspense fallback={<DashboardSkeleton />}>
            <div className="grid gap-6">
              <InvoiceStatusCards />
              <InvoiceFilters />
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <InvoiceCharts className="lg:col-span-4" />
              </div>
            </div>
          </Suspense>
        </DashboardShell>
      </div>
    </div>
  )
}
