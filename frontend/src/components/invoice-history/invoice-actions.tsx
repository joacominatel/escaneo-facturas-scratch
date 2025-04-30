/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import React, { useState } from 'react'
import { MoreHorizontal, CheckCircle, XCircle, RefreshCw, Download, Eye, ArrowRightCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useInvoiceActions } from "@/hooks/use-invoice-actions"
import { type InvoiceStatus, type InvoiceListItem } from "@/lib/api/types"
import { downloadInvoice } from "@/lib/api/invoices"
import { toast } from "sonner"
import { useRouter } from 'next/navigation' // Para la redirección
import { RejectDialog } from './reject-dialog'

interface InvoiceActionsProps {
  invoice: InvoiceListItem
  onActionComplete: () => void // Para refrescar la lista después de una acción
  onViewDetails: () => void; // <--- Añadir la nueva prop
}

export function InvoiceActions({ invoice, onActionComplete, onViewDetails }: InvoiceActionsProps) {
  const router = useRouter()
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
  const {
    confirmInvoice,
    rejectInvoice,
    retryInvoice,
    isConfirming,
    isRejecting,
    isRetrying,
  } = useInvoiceActions()

  const isLoading = isConfirming || isRejecting || isRetrying

  const handleDownload = async () => {
    try {
      const blob = await downloadInvoice(invoice.id)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = invoice.filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      toast.success("Archivo descargado", { description: invoice.filename })
    } catch (error: any) {
      console.error("Error al descargar la factura:", error)
      toast.error("Error al descargar", { description: error.message || "No se pudo descargar el archivo." })
    }
  }

  const handleConfirm = async () => {
    const result = await confirmInvoice(invoice.id)
    if (result) {
      onActionComplete() // Refrescar lista
    }
  }

  const handleReject = async (reason?: string) => {
    const result = await rejectInvoice(invoice.id, reason)
    if (result) {
      setIsRejectDialogOpen(false)
      onActionComplete() // Refrescar lista
    }
  }

  const handleRejectClick = () => {
    setIsRejectDialogOpen(true)
  }

  const handleRetry = async () => {
    const result = await retryInvoice(invoice.id)
    if (result) {
      onActionComplete() // Refrescar lista
    }
  }

  const handleView = () => {
    onViewDetails(); // Llamar a la función pasada desde la tabla
  }

  const handleRedirectToOriginal = () => {
    // Filtrar la URL actual para mostrar solo la factura original por nombre
    // Esto requiere que la página principal pueda manejar parámetros de búsqueda
    const params = new URLSearchParams(window.location.search)
    params.set("search", invoice.filename) // Buscar por nombre
    params.delete("status") // Quitar filtro de estado actual (si existe)

    // Recargar la página con los nuevos parámetros de búsqueda
    router.push(`${window.location.pathname}?${params.toString()}`)
    toast.info("Buscando factura original", { description: `Filtrando por nombre: ${invoice.filename}` })
  }

  const getAvailableActions = (status: InvoiceStatus): React.ReactNode[] => {
    const actions: React.ReactNode[] = []

    switch (status) {
      case "processing":
        actions.push(
          <DropdownMenuItem key="download" onClick={handleDownload} disabled={isLoading}>
            <Download className="mr-2 h-4 w-4" /> Descargar
          </DropdownMenuItem>
        )
        break
      case "waiting_validation":
        actions.push(
          <DropdownMenuItem key="confirm" onClick={handleConfirm} disabled={isLoading}>
            <CheckCircle className="mr-2 h-4 w-4" /> Confirmar
          </DropdownMenuItem>,
          <DropdownMenuItem key="reject" onClick={handleRejectClick} disabled={isLoading}>
            <XCircle className="mr-2 h-4 w-4" /> Rechazar
          </DropdownMenuItem>,
          <DropdownMenuItem key="view" onClick={handleView} disabled={isLoading}>
            <Eye className="mr-2 h-4 w-4" /> Ver
          </DropdownMenuItem>,
          <DropdownMenuSeparator key="sep1" />,
          <DropdownMenuItem key="download" onClick={handleDownload} disabled={isLoading}>
            <Download className="mr-2 h-4 w-4" /> Descargar
          </DropdownMenuItem>
        )
        break
      case "processed":
        actions.push(
          <DropdownMenuItem key="view" onClick={handleView} disabled={isLoading}>
            <Eye className="mr-2 h-4 w-4" /> Ver
          </DropdownMenuItem>,
          <DropdownMenuItem key="download" onClick={handleDownload} disabled={isLoading}>
            <Download className="mr-2 h-4 w-4" /> Descargar
          </DropdownMenuItem>
        )
        break
      case "failed":
        actions.push(
          <DropdownMenuItem key="retry" onClick={handleRetry} disabled={isLoading}>
            <RefreshCw className="mr-2 h-4 w-4" /> Reintentar
          </DropdownMenuItem>,
          <DropdownMenuItem key="download" onClick={handleDownload} disabled={isLoading}>
            <Download className="mr-2 h-4 w-4" /> Descargar
          </DropdownMenuItem>
        )
        break
      case "rejected":
        actions.push(
          <DropdownMenuItem key="retry" onClick={handleRetry} disabled={isLoading}>
            <RefreshCw className="mr-2 h-4 w-4" /> Reintentar
          </DropdownMenuItem>,
          <DropdownMenuItem key="view" onClick={handleView} disabled={isLoading}>
            <Eye className="mr-2 h-4 w-4" /> Ver
          </DropdownMenuItem>,
          <DropdownMenuSeparator key="sep2" />,
          <DropdownMenuItem key="download" onClick={handleDownload} disabled={isLoading}>
            <Download className="mr-2 h-4 w-4" /> Descargar
          </DropdownMenuItem>
        )
        break
      case "duplicated":
        actions.push(
          <DropdownMenuItem key="redirect" onClick={handleRedirectToOriginal} disabled={isLoading}>
            <ArrowRightCircle className="mr-2 h-4 w-4" /> Buscar Original
          </DropdownMenuItem>,
          <DropdownMenuItem key="download" onClick={handleDownload} disabled={isLoading}>
            <Download className="mr-2 h-4 w-4" /> Descargar
          </DropdownMenuItem>
        )
        break
      default:
        return [] // No actions for unknown status
    }
    return actions
  }

  const availableActions = getAvailableActions(invoice.status)

  if (availableActions.length === 0) {
    return null // No renderizar nada si no hay acciones
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0" disabled={isLoading}>
            <span className="sr-only">Abrir menú</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {availableActions}
        </DropdownMenuContent>
      </DropdownMenu>

      <RejectDialog
        isOpen={isRejectDialogOpen}
        onClose={() => setIsRejectDialogOpen(false)}
        onConfirm={handleReject}
        invoiceId={invoice.id}
      />
    </>
  )
} 