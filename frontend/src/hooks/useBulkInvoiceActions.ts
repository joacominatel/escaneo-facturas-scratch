"use client"

import { useState, useCallback } from "react"
import { toast } from "sonner"
import { useInvoiceActions } from "./api/useInvoiceActions"

/**
 * Hook para gestionar acciones en lote sobre múltiples facturas
 */
export function useBulkInvoiceActions() {
  const [selectedInvoices, setSelectedInvoices] = useState<number[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const { confirmInvoice, retryInvoice, isLoading: isActionLoading } = useInvoiceActions()

  // Determinar si todas las facturas en una lista están seleccionadas
  const areAllSelected = useCallback((invoiceIds: number[]) => {
    return invoiceIds.length > 0 && invoiceIds.every(id => selectedInvoices.includes(id))
  }, [selectedInvoices])

  // Seleccionar una factura
  const toggleInvoice = useCallback((invoiceId: number) => {
    setSelectedInvoices(prev => {
      if (prev.includes(invoiceId)) {
        return prev.filter(id => id !== invoiceId)
      } else {
        return [...prev, invoiceId]
      }
    })
  }, [])

  // Seleccionar todas las facturas
  const toggleSelectAll = useCallback((invoiceIds: number[]) => {
    setSelectedInvoices(prev => {
      const allSelected = areAllSelected(invoiceIds)
      if (allSelected) {
        return prev.filter(id => !invoiceIds.includes(id))
      } else {
        const newSelected = [...prev]
        invoiceIds.forEach(id => {
          if (!newSelected.includes(id)) {
            newSelected.push(id)
          }
        })
        return newSelected
      }
    })
  }, [areAllSelected])

  // Limpiar selección
  const clearSelection = useCallback(() => {
    setSelectedInvoices([])
  }, [])

  // Acción en lote: confirmar facturas
  const confirmSelectedInvoices = useCallback(async () => {
    if (selectedInvoices.length === 0) return

    setIsProcessing(true)
    const results = { success: 0, error: 0 }

    try {
      for (const invoiceId of selectedInvoices) {
        try {
          await confirmInvoice(invoiceId)
          results.success++
        } catch (error) {
          results.error++
        }
      }

      if (results.success > 0) {
        toast.success(
          `${results.success} ${results.success === 1 ? "factura confirmada" : "facturas confirmadas"} correctamente`,
          {
            description: results.error > 0 
              ? `No se pudieron procesar ${results.error} facturas` 
              : "Todas las facturas se procesaron correctamente"
          }
        )
      } else {
        toast.error("No se pudo confirmar ninguna factura", {
          description: "Intente nuevamente más tarde"
        })
      }
      
      // Limpiar selección si tuvo éxito al menos en una factura
      if (results.success > 0) {
        clearSelection()
      }

      return results
    } catch (error) {
      toast.error("Error al procesar facturas en lote")
      return null
    } finally {
      setIsProcessing(false)
    }
  }, [selectedInvoices, confirmInvoice, clearSelection])

  // Acción en lote: reintentar facturas
  const retrySelectedInvoices = useCallback(async () => {
    if (selectedInvoices.length === 0) return

    setIsProcessing(true)
    const results = { success: 0, error: 0 }

    try {
      for (const invoiceId of selectedInvoices) {
        try {
          await retryInvoice(invoiceId)
          results.success++
        } catch (error) {
          results.error++
        }
      }

      if (results.success > 0) {
        toast.success(
          `${results.success} ${results.success === 1 ? "factura reintentada" : "facturas reintentadas"} correctamente`,
          {
            description: results.error > 0 
              ? `No se pudieron procesar ${results.error} facturas` 
              : "Todas las facturas se procesaron correctamente"
          }
        )
      } else {
        toast.error("No se pudo reintentar ninguna factura", {
          description: "Intente nuevamente más tarde"
        })
      }
      
      // Limpiar selección si tuvo éxito al menos en una factura
      if (results.success > 0) {
        clearSelection()
      }

      return results
    } catch (error) {
      toast.error("Error al procesar facturas en lote")
      return null
    } finally {
      setIsProcessing(false)
    }
  }, [selectedInvoices, retryInvoice, clearSelection])

  return {
    selectedInvoices,
    isProcessing,
    isActionLoading: isProcessing || isActionLoading,
    hasSelection: selectedInvoices.length > 0,
    selectionCount: selectedInvoices.length,
    toggleInvoice,
    toggleSelectAll,
    areAllSelected,
    clearSelection,
    confirmSelectedInvoices,
    retrySelectedInvoices
  }
}