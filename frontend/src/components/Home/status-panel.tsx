"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface StatusPanelProps {
  title: string
  value: number
  color: {
    bg: string
    text: string
    border: string
  }
  icon: React.ReactNode
  description: string
  isLoading: boolean
}

export function StatusPanel({ title, value, color, icon, description, isLoading }: StatusPanelProps) {
  if (isLoading) {
    return (
      <Card className={cn("border", color.border)}>
        <CardHeader className={cn("flex flex-row items-center justify-between space-y-0 pb-2", color.bg)}>
          <CardTitle className={cn("text-sm font-medium", color.text)}>
            <Skeleton className="h-4 w-24" />
          </CardTitle>
          <Skeleton className="h-5 w-5 rounded-full" />
        </CardHeader>
        <CardContent className="pt-4">
          <Skeleton className="h-8 w-12 mb-1" />
          <Skeleton className="h-3 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("border transition-all duration-300 hover:shadow-md", color.border)}>
      <CardHeader className={cn("flex flex-row items-center justify-between space-y-0 pb-2", color.bg)}>
        <CardTitle className={cn("text-sm font-medium", color.text)}>{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent className="pt-4">
        <div className={cn("text-2xl font-bold mb-1", color.text)}>{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}