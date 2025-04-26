"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { formatDate } from "@/lib/utils"
import { motion } from "framer-motion"
import { Check, Download, Eye, ExternalLink, RotateCw, X } from "lucide-react"

import { InvoiceItemProps, InvoiceStatusType } from "./types"
import { getAvailableActions, getStatusBackground, statusMap } from "./utils"

export function InvoiceItem({
  invoice,
  onView,
  onDownload,
  onRetry,
  onConfirm,
  onReject,
  isRetrying,
  isConfirming,
  isRejecting,
  activeActionId,
}: InvoiceItemProps) {
  const availableActions = getAvailableActions(invoice.status as any)
  const isActive = activeActionId === invoice.id
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex flex-col space-y-2 rounded-md border p-3 text-sm",
        getStatusBackground(invoice.status as any),
      )}
    >
      <div className="flex items-center justify-between">
        <div className="font-medium">{invoice.filename}</div>
        <Badge variant={statusMap[invoice.status as InvoiceStatusType]?.variant || "default"}>
          {statusMap[invoice.status as InvoiceStatusType]?.label || invoice.status}
        </Badge>
      </div>
      <div className="flex items-center justify-between text-muted-foreground">
        <div>ID: {invoice.id}</div>
        <div>{formatDate(invoice.created_at)}</div>
      </div>
      <div className="flex items-center justify-end">
        <div className="flex space-x-2">
          {availableActions.includes("retry") && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onRetry(invoice.id)}
              disabled={isRetrying && isActive}
            >
              <RotateCw className={cn("h-4 w-4", isRetrying && isActive && "animate-spin")} />
              <span className="sr-only">Retry</span>
            </Button>
          )}
          {availableActions.includes("view") && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onView(invoice.id)}
            >
              <Eye className="h-4 w-4" />
              <span className="sr-only">View</span>
            </Button>
          )}
          {availableActions.includes("download") && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onDownload(invoice.id)}
            >
              <Download className="h-4 w-4" />
              <span className="sr-only">Download</span>
            </Button>
          )}
          {availableActions.includes("redirect") && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
            >
              <ExternalLink className="h-4 w-4" />
              <span className="sr-only">Redirect</span>
            </Button>
          )}
          {availableActions.includes("confirm") && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-green-600"
              onClick={() => onConfirm(invoice.id)}
              disabled={isConfirming && isActive}
            >
              <Check className={cn("h-4 w-4", isConfirming && isActive && "animate-spin")} />
              <span className="sr-only">Confirm</span>
            </Button>
          )}
          {availableActions.includes("reject") && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-600"
              onClick={() => onReject(invoice.id)}
              disabled={isRejecting && isActive}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Reject</span>
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  )
}