"use client"

import { useState } from "react"
import { toast } from "sonner"
import { getApiUrl } from "@/lib/env"

interface UploadResponse {
  invoice_id: number
  filename: string
  summary: string
  raw_text: string
}

export function useInvoiceUpload() {
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [uploadedInvoices, setUploadedInvoices] = useState<UploadResponse[]>([])

  const uploadInvoices = async (files: File[]) => {
    if (files.length === 0) return

    setIsUploading(true)
    setProgress(0)

    try {
      // Crear FormData para enviar los archivos
      const formData = new FormData()
      files.forEach((file) => {
        formData.append("files", file)
      })

      // Simular progreso de carga
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 5
        })
      }, 200)

      // Realizar la petición a la API
      const response = await fetch(getApiUrl("api/invoices/ocr"), {
        method: "POST",
        body: formData,
      })

      clearInterval(progressInterval)

      if (!response.ok) {
        throw new Error(`Error al subir facturas: ${response.statusText}`)
      }

      const data: UploadResponse[] = await response.json()
      setUploadedInvoices(data)
      setProgress(100)

      toast("Facturas subidas correctamente", {
          description: `Se han subido ${files.length} facturas para procesamiento`,
        })

      return data
    } catch (error) {
      console.error("Error al subir facturas:", error)
      toast("Error al subir facturas", {
        description: error instanceof Error ? error.message : "Ocurrió un error desconocido",
      })
      return null
    } finally {
      setIsUploading(false)
    }
  }

  return {
    uploadInvoices,
    isUploading,
    progress,
    uploadedInvoices,
  }
}
