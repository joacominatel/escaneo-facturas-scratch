'use client'

import React from 'react'
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface LiveUpdateButtonProps {
  isConnected: boolean
  isConnecting: boolean
  onToggle: () => void
}

export function LiveUpdateButton({
  isConnected,
  isConnecting,
  onToggle,
}: LiveUpdateButtonProps) {
  const getButtonText = () => {
    if (isConnecting) return "Conectando..."
    if (isConnected) return "Live"
    return "Activar Live"
  }

  const getButtonVariant = () => {
    if (isConnected) return "default" // O un verde específico si lo tienes
    return "outline"
  }

  return (
    <Button
      variant={getButtonVariant()}
      onClick={onToggle}
      disabled={isConnecting}
      className={cn(
        "relative transition-colors duration-300",
        isConnected && "bg-green-600 hover:bg-green-700 text-white",
        isConnecting && "cursor-wait"
      )}
    >
      {isConnected && (
        <span className="absolute top-1 right-1 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
        </span>
      )}
      {getButtonText()}
    </Button>
  )
} 