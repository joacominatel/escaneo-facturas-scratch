"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertCircle, RefreshCw } from "lucide-react"

interface ErrorAlertProps {
  title: string
  message: string
  onRetry?: () => void
}

export function ErrorAlert({ title, message, onRetry }: ErrorAlertProps) {
  return (
    <Alert variant="destructive" className="h-auto">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="flex flex-col gap-2">
        <p>{message}</p>
        {onRetry && (
          <Button variant="outline" size="sm" className="w-fit mt-2" onClick={onRetry}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reintentar
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}
