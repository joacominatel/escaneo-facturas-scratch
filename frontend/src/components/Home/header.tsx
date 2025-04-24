"use client"

import { Button } from "@/components/ui/button"
import { FileText, UploadCloud } from "lucide-react"

interface HeaderProps {
  activeTab: string
}

export function Header({ activeTab }: HeaderProps) {
  return (
    <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Escaneo de Facturas</h1>
        <p className="text-muted-foreground">Sube, procesa y gestiona tus facturas de forma automática.</p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="h-9">
          <FileText className="mr-2 h-4 w-4" />
          Ver Guía
        </Button>
        <Button size="sm" className="h-9" asChild={activeTab !== "upload"}>
          {activeTab === "upload" ? (
            <span>
              <UploadCloud className="mr-2 h-4 w-4" />
              Subir Facturas
            </span>
          ) : (
            <a href="?tab=upload">
              <UploadCloud className="mr-2 h-4 w-4" />
              Subir Facturas
            </a>
          )}
        </Button>
      </div>
    </div>
  )
}