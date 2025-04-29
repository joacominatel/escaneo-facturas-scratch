'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { InvoiceListItem, InvoiceStatus } from "@/lib/api/types"
import { useInvoiceActions } from "@/hooks/use-invoice-actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, RefreshCw, X, AlertCircle } from "lucide-react"
import { toast } from "sonner"

// Acciones permitidas en masa por estado
const allowedBulkActions: Partial<Record<InvoiceStatus, Array<"confirm" | "retry">>> = {
  waiting_validation: ["confirm"],
  failed: ["retry"],
  rejected: ["retry"],
}

interface BulkActionBarProps {
  selectedInvoices: InvoiceListItem[];
  onActionComplete: () => void;
  onClearSelection: () => void;
}

export function BulkActionBar({ selectedInvoices, onActionComplete, onClearSelection }: BulkActionBarProps) {
  const { confirmInvoice, retryInvoice, isConfirming, isRetrying } = useInvoiceActions()
  const [isProcessingBulkAction, setIsProcessingBulkAction] = useState(false)

  const isLoading = isConfirming || isRetrying || isProcessingBulkAction

  // Calcular acciones comunes disponibles
  const commonActions = useMemo(() => {
    if (!selectedInvoices || selectedInvoices.length === 0) {
      return []
    }

    const statuses = new Set(selectedInvoices.map(inv => inv.status))

    if (statuses.size === 0) {
      return []
    }

    let possibleActions: Array<"confirm" | "retry"> | null = null

    for (const status of statuses) {
      const actionsForStatus = allowedBulkActions[status] || []
      if (possibleActions === null) {
        // Primera iteración, tomar las acciones de este estado
        possibleActions = [...actionsForStatus]
      } else {
        // Intersección: mantener solo las acciones presentes en ambos conjuntos
        possibleActions = possibleActions.filter(action => actionsForStatus.includes(action))
      }
      // Si en algún punto no quedan acciones posibles, detener
      if (possibleActions.length === 0) break
    }

    return possibleActions || []

  }, [selectedInvoices])

  // Ejecutar acción en masa
  const handleBulkAction = useCallback(async (actionType: "confirm" | "retry") => {
    setIsProcessingBulkAction(true)
    const actionFn = actionType === 'confirm' ? confirmInvoice : retryInvoice
    const actionVerb = actionType === 'confirm' ? 'confirmadas' : 'reintentadas'
    const actionVerbGerund = actionType === 'confirm' ? 'confirmando' : 'reintentando'

    const toastId = toast.loading(`${actionVerbGerund} ${selectedInvoices.length} facturas...`)

    const results = await Promise.allSettled(
      selectedInvoices.map(invoice => actionFn(invoice.id))
    )

    setIsProcessingBulkAction(false)

    let successCount = 0
    let failureCount = 0
    const failedDetails: string[] = []

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        successCount++;
      } else {
        failureCount++;
        const invoice = selectedInvoices[index];
        const errorMsg = (result.status === 'rejected' ? result.reason?.message : 'Error desconocido') || 'Error desconocido'
        failedDetails.push(`${invoice.filename}: ${errorMsg}`);
      }
    })

    if (failureCount === 0) {
      toast.success(`${successCount} facturas ${actionVerb} correctamente.`, { id: toastId });
    } else if (successCount === 0) {
      toast.error(`Error al ${actionType} ${failureCount} facturas.`, {
         id: toastId,
         description: 
            <details className="mt-2">
                <summary>Ver detalles ({failureCount})</summary>
                <ul className="list-disc pl-4 text-xs max-h-20 overflow-y-auto">
                    {failedDetails.map((detail, i) => <li key={i}>{detail}</li>)}
                </ul>
            </details>
        });
    } else {
       toast.warning(`${successCount} facturas ${actionVerb}, ${failureCount} fallaron.`, {
         id: toastId,
         description:
             <details className="mt-2">
                 <summary>Ver detalles de errores ({failureCount})</summary>
                 <ul className="list-disc pl-4 text-xs max-h-20 overflow-y-auto">
                    {failedDetails.map((detail, i) => <li key={i}>{detail}</li>)}
                 </ul>
             </details>
        });
    }

    onActionComplete(); // Refresca la tabla (y debería limpiar selección según la lógica en la tabla)

  }, [selectedInvoices, confirmInvoice, retryInvoice, onActionComplete])


  if (selectedInvoices.length === 0) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-auto max-w-[90%] z-50">
      <Card className="shadow-lg border bg-card/95 backdrop-blur-sm">
        <CardContent className="p-3 flex items-center justify-between gap-4">
          <div className="text-sm font-medium">
            {selectedInvoices.length} {selectedInvoices.length === 1 ? 'factura seleccionada' : 'facturas seleccionadas'}
          </div>
          <div className="flex items-center gap-2">
            {commonActions.includes('confirm') && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkAction('confirm')}
                disabled={isLoading}
                className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Confirmar Selección
              </Button>
            )}
            {commonActions.includes('retry') && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkAction('retry')}
                disabled={isLoading}
                className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Reintentar Selección
              </Button>
            )}
             {commonActions.length === 0 && selectedInvoices.length > 0 && (
                 <div className="flex items-center gap-1 text-xs text-muted-foreground">
                     <AlertCircle className="h-4 w-4 text-orange-500"/>
                    <span>No hay acciones comunes disponibles.</span>
                </div>
             )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:bg-muted/50"
            onClick={onClearSelection} // Botón para cerrar/limpiar
            disabled={isLoading}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Limpiar selección</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
} 