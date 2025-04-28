"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchInvoiceData } from "@/lib/api"
import { toast } from "sonner"
import { cn, formatCurrency } from "@/lib/utils"
import { motion } from "framer-motion"
import { DollarSign, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react'

interface FinancialMetricsProps {
  className?: string
}

export function FinancialMetrics({ className }: FinancialMetricsProps) {
  const [metrics, setMetrics] = useState<{
    totalAmount: number
    averageAmount: number
    largestInvoice: number
    invoiceCount: number
    currency: string
  }>({
    totalAmount: 0,
    averageAmount: 0,
    largestInvoice: 0,
    invoiceCount: 0,
    currency: "USD",
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const getFinancialMetrics = async () => {
      try {
        setIsLoading(true)
        const data = await fetchInvoiceData()
        
        if (data.invoices && data.invoices.length > 0) {
          // Calculate financial metrics from invoice data
          const invoices = data.invoices
          const totalAmount = invoices.reduce((sum: number, invoice: any) => sum + (invoice.amount_total || 0), 0)
          const averageAmount = totalAmount / invoices.length
          const largestInvoice = Math.max(...invoices.map((invoice: any) => invoice.amount_total || 0))
          const currency = invoices[0].currency || "USD"
          
          setMetrics({
            totalAmount,
            averageAmount,
            largestInvoice,
            invoiceCount: invoices.length,
            currency,
          })
        }
      } catch (err) {
        console.error("Failed to fetch financial metrics:", err)
        toast("Failed to load financial metrics")
        // Use sample data as fallback
        setMetrics({
          totalAmount: 1250000,
          averageAmount: 125000,
          largestInvoice: 450000,
          invoiceCount: 10,
          currency: "USD",
        })
      } finally {
        setIsLoading(false)
      }
    }

    getFinancialMetrics()
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-4", className)}
    >
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Total Invoice Value</CardTitle>
          <DollarSign className="h-4 w-4 text-blue-500 dark:text-blue-400" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-28" />
          ) : (
            <div className="text-2xl font-bold">{formatCurrency(metrics.totalAmount, metrics.currency)}</div>
          )}
          <p className="text-xs text-muted-foreground">Across {metrics.invoiceCount} invoices</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Average Invoice</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-500 dark:text-green-400" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-28" />
          ) : (
            <div className="text-2xl font-bold">{formatCurrency(metrics.averageAmount, metrics.currency)}</div>
          )}
          <p className="text-xs text-muted-foreground">Per invoice average</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Largest Invoice</CardTitle>
          <AlertCircle className="h-4 w-4 text-purple-500 dark:text-purple-400" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-28" />
          ) : (
            <div className="text-2xl font-bold">{formatCurrency(metrics.largestInvoice, metrics.currency)}</div>
          )}
          <p className="text-xs text-muted-foreground">Highest value invoice</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 border-amber-200 dark:border-amber-800">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Invoice Count</CardTitle>
          <TrendingDown className="h-4 w-4 text-amber-500 dark:text-amber-400" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-28" />
          ) : (
            <div className="text-2xl font-bold">{metrics.invoiceCount}</div>
          )}
          <p className="text-xs text-muted-foreground">Total invoices processed</p>
        </CardContent>
      </Card>
    </motion.div>
  )
}
