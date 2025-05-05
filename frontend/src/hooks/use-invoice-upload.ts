"use client"

import { useState } from "react"
import { getApiBaseUrl } from "@/lib/api"
import { toast } from "sonner"

export interface UploadResponse {
  invoice_id: number | null // ID can be null for errors/duplicates
  filename: string
  status: string // e.g., "processing", "duplicated", "error"
  message: string
}

// Definir un tipo para el placeholder genérico
export const GENERIC_COMPANY_ID = "generic";

export function useInvoiceUpload() {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadResponse, setUploadResponse] = useState<UploadResponse[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const uploadInvoices = async (
    files: File[], 
    // Aceptar companyId opcional (puede ser número o el string "generic")
    companyId?: number | typeof GENERIC_COMPANY_ID 
  ): Promise<UploadResponse[] | null> => {
    if (!files.length) {
      setError("No files selected")
      return null
    }

    // 1. Eliminar validación ZIP y permitir solo PDF
    const validFiles = files.filter((file) => {
      const fileType = file.type
      const fileExtension = file.name.split(".").pop()?.toLowerCase()
      return fileType === "application/pdf" || fileExtension === "pdf"
    })

    if (validFiles.length !== files.length) {
      setError("Solo se permiten archivos PDF")
      // Podríamos devolver las respuestas de error para los archivos no válidos si la API lo soportara
      // Por ahora, simplemente bloqueamos la subida si hay inválidos.
      return null 
    }

    // 2. Validar que no haya archivos inválidos antes de proceder
    if (validFiles.length === 0) {
        setError("Ningún archivo PDF válido seleccionado.");
        return null;
    }

    try {
      setIsUploading(true)
      setUploadProgress(0)
      setError(null)

      const formData = new FormData()
      
      validFiles.forEach((file) => {
        formData.append("file", file) // Key debe ser "file" según API docs
      })

      // 3. Añadir company_id a FormData si es válido y no genérico
      if (companyId && companyId !== GENERIC_COMPANY_ID) {
          formData.append("company_id", String(companyId))
          console.log("Uploading with Company ID:", companyId) // Para depuración
      } else {
          console.log("Uploading without specific Company ID (Generic).") // Para depuración
      }

      // --- Lógica de subida con XMLHttpRequest (sin cambios funcionales aquí) --- 
      const xhr = new XMLHttpRequest()
      
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100)
          setUploadProgress(progress)
        }
      })

      const response = await new Promise<UploadResponse[]>((resolve, reject) => {
        xhr.open("POST", `${getApiBaseUrl()}/api/invoices/ocr`) // Endpoint correcto
        
        // Considerar añadir headers si se requiere autenticación
        // xhr.setRequestHeader('Authorization', 'Bearer YOUR_TOKEN');
        
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText) as UploadResponse[]
              // Verificar si la respuesta es realmente un array
              if (Array.isArray(data)) {
                   resolve(data)
              } else {
                   // Si la API devuelve un solo objeto en éxito, envolverlo en array
                   // O ajustar el tipo UploadResponse si no siempre es array
                   console.warn("API response was not an array, wrapping it.", data)
                   // Asumiendo que si no es array, es un error o una respuesta inesperada
                   // O podría ser un solo objeto UploadResponse si solo se sube 1 archivo?
                   // Ajustar según comportamiento real de la API.
                   // Por seguridad, rechazamos si no es array.
                   reject(new Error("Respuesta inesperada del servidor (no es un array)"))
              }
            } catch (parseError) {
              console.error("Error parsing response:", xhr.responseText, parseError)
              reject(new Error("No se pudo interpretar la respuesta del servidor"))
            }
          } else {
              // Intentar parsear el error del cuerpo si es JSON
              let errorMessage = `Error en la subida: ${xhr.status} ${xhr.statusText}`
              try {
                  const errorData = JSON.parse(xhr.responseText)
                  errorMessage = errorData.error || errorData.message || errorMessage
              } catch {}
              reject(new Error(errorMessage))
          }
        }
        
        xhr.onerror = () => {
          reject(new Error("Error de red durante la subida"))
        }
        
        xhr.send(formData)
      })

      setUploadResponse(response) 
      toast.success("Archivos subidos correctamente!") // Mover toast aquí
      return response

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Ocurrió un error desconocido durante la subida"
      setError(errorMessage)
      toast.error("Fallo en la subida", {
        description: errorMessage,
      })
      return null
    } finally {
      setIsUploading(false)
    }
  }

  const resetUpload = () => {
    setUploadResponse(null)
    setError(null)
    setUploadProgress(0)
  }

  return {
    uploadInvoices,
    isUploading,
    uploadProgress,
    uploadResponse,
    error,
    resetUpload,
  }
}
