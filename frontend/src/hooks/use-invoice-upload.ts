"use client"

import { useState } from "react"
import { getApiBaseUrl } from "@/lib/api"
import { toast } from "sonner"

export interface UploadResponse {
  invoice_id: number
  filename: string
  status: string
  message: string
}

export function useInvoiceUpload() {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadResponse, setUploadResponse] = useState<UploadResponse[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const uploadInvoices = async (files: File[]): Promise<UploadResponse[] | null> => {
    if (!files.length) {
      setError("No files selected")
      return null
    }

    // Validate file types
    const validFiles = files.filter((file) => {
      const fileType = file.type
      const fileExtension = file.name.split(".").pop()?.toLowerCase()

      return (
        fileType === "application/pdf" ||
        fileExtension === "pdf" ||
        fileType === "application/zip" ||
        fileType === "application/x-zip-compressed" ||
        fileExtension === "zip"
      )
    })

    if (validFiles.length !== files.length) {
      setError("Only PDF and ZIP files are allowed")
      return null
    }

    // Check if there's more than one ZIP file
    const zipFiles = validFiles.filter(
      (file) => file.type === "application/zip" || file.type === "application/x-zip-compressed" || file.name.endsWith(".zip")
    )

    if (zipFiles.length > 1) {
      setError("Only one ZIP file can be uploaded at a time")
      return null
    }

    try {
      setIsUploading(true)
      setUploadProgress(0)
      setError(null)

      const formData = new FormData()
      
      // Append all files with the same field name "file"
      validFiles.forEach((file) => {
        formData.append("file", file)
      })

      const xhr = new XMLHttpRequest()
      
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100)
          setUploadProgress(progress)
        }
      })

      const response = await new Promise<UploadResponse[]>((resolve, reject) => {
        xhr.open("POST", `${getApiBaseUrl()}/api/invoices/ocr`)
        
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText)
              resolve(data)
            } catch {
              reject(new Error("Failed to parse response"))
            }
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`))
          }
        }
        
        xhr.onerror = () => {
          reject(new Error("Network error occurred"))
        }
        
        xhr.send(formData)
      })

      setUploadResponse(response)
      return response
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred"
      setError(errorMessage)
      toast.error("Upload failed", {
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
