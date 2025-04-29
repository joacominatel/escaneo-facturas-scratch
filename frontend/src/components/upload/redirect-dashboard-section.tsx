"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { FileText } from "lucide-react"

export function RedirectDashboardSection() {
    const router = useRouter()

    return (
        <div className="rounded-md bg-muted p-4">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          <p className="font-medium">Ver todas las facturas en el Dashboard</p>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Puedes ver todas tus facturas, su estado y tomar acciones sobre ellas desde el dashboard principal o el historial.
        </p>
        <div className="mt-4">
          <Button variant="outline" className="w-full"
            onClick={() => router.push('/')}
          >
            Ir al Dashboard
          </Button>
        </div>
      </div>
    )
}