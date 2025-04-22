"use client"

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const data = [
  {
    name: "Procesadas",
    total: 128,
    color: "#16a34a",
  },
  {
    name: "Pendientes",
    total: 8,
    color: "#f59e0b",
  },
  {
    name: "Rechazadas",
    total: 6,
    color: "#dc2626",
  },
]

export function InvoiceStatusSummary() {
  return (
    <ChartContainer
      config={{
        total: {
          label: "Facturas",
          color: "var(--color)",
        },
      }}
      className="h-[300px]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" />
          <YAxis />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="total" radius={[4, 4, 0, 0]} className="fill-primary" fill="var(--color)" />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
