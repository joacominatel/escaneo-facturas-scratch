'use client' // Necesario ya que InvoiceTable es un Client Component

import React from 'react'
import { InvoiceTable } from "@/components/invoice-history/invoice-table/index"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function HistoryPage() {
  return (
    <div className="space-y-8 p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle>Historial de Facturas</CardTitle>
          <CardDescription>
            Gestiona, filtra y visualiza todas las facturas procesadas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InvoiceTable />
        </CardContent>
      </Card>
    </div>
  )
}