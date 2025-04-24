"use client"

import { Loader2 } from "lucide-react"

interface InvoiceStatusProps {
  isLoading: boolean
  error: string | null
  isEmpty: boolean
  emptyMessage?: string
  loadingMessage?: string
  errorMessage?: string
}

export function InvoiceStatus({
  isLoading,
  error,
  isEmpty,
  emptyMessage = "No se encontraron facturas con los criterios especificados",
  loadingMessage = "Cargando facturas...",
  errorMessage = "Error al cargar las facturas: "
}: InvoiceStatusProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40 w-full">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>{loadingMessage}</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-40 w-full">
        <div className="text-red-600">
          {errorMessage} {error}
        </div>
      </div>
    )
  }

  if (isEmpty) {
    return (
      <div className="flex justify-center items-center h-40 w-full">
        <div className="text-muted-foreground">{emptyMessage}</div>
      </div>
    )
  }

  return null
}