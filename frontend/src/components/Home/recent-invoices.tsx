"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowUpRight, CheckCircle, Clock, XCircle } from "lucide-react"

type InvoiceStatus = "processed" | "pending" | "rejected"

interface Invoice {
  id: string
  number: string
  date: string
  amount: string
  status: InvoiceStatus
}

const recentInvoices: Invoice[] = [
  {
    id: "INV-001",
    number: "F-2023-0123",
    date: "2023-04-22",
    amount: "1,245.00 €",
    status: "processed",
  },
  {
    id: "INV-002",
    number: "F-2023-0124",
    date: "2023-04-22",
    amount: "845.50 €",
    status: "processed",
  },
  {
    id: "INV-003",
    number: "F-2023-0125",
    date: "2023-04-21",
    amount: "1,045.75 €",
    status: "pending",
  },
  {
    id: "INV-004",
    number: "F-2023-0126",
    date: "2023-04-21",
    amount: "2,345.00 €",
    status: "rejected",
  },
  {
    id: "INV-005",
    number: "F-2023-0127",
    date: "2023-04-20",
    amount: "545.25 €",
    status: "processed",
  },
]

export function RecentInvoices() {
  const getStatusIcon = (status: InvoiceStatus) => {
    switch (status) {
      case "processed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "pending":
        return <Clock className="h-4 w-4 text-amber-500" />
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-500" />
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
      case "pending":
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            Pendiente
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Rechazada
          </Badge>
        )
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {recentInvoices.map((invoice) => (
          <div key={invoice.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
            <div className="flex items-center space-x-3">
              {getStatusIcon(invoice.status)}
              <div>
                <p className="text-sm font-medium">{invoice.number}</p>
                <p className="text-xs text-muted-foreground">{invoice.date}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium">{invoice.amount}</p>
                <div className="mt-1">{getStatusBadge(invoice.status)}</div>
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
