import { Suspense } from "react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { InvoiceStatusCards } from "@/components/dashboard/invoice-status-cards"
import { RecentInvoices } from "@/components/dashboard/recent-invoices"
import { InvoiceCharts } from "@/components/dashboard/invoice-charts"
import { InvoiceFilters } from "@/components/dashboard/invoice-filters"
import { FinancialMetrics } from "@/components/dashboard/financial-metrics"
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton"

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl rounded-xl bg-white dark:bg-slate-800 shadow-sm p-4 md:p-6 lg:p-8">
        <DashboardShell>
          <DashboardHeader heading="Invoice Dashboard" text="Monitor and manage your invoice processing workflow." />
          <Suspense fallback={<DashboardSkeleton />}>
            <div className="grid gap-6">
              <InvoiceStatusCards />
              <FinancialMetrics />
              <InvoiceFilters />
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <InvoiceCharts className="lg:col-span-4" />
                <RecentInvoices className="lg:col-span-3" />
              </div>
            </div>
          </Suspense>
        </DashboardShell>
      </div>
    </div>
  )
}
