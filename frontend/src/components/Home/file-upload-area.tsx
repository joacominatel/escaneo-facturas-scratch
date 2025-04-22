"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { FileIcon, UploadCloud, X } from "lucide-react"
import { toast } from "sonner"

export function FileUploadArea() {
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      const validFiles = newFiles.filter(
        (file) =>
          file.type === "application/pdf" ||
          file.type === "application/zip" ||
          file.type === "application/x-zip-compressed",
      )

      if (validFiles.length !== newFiles.length) {
        toast("Archivos no válidos", {
          description: "Solo se permiten archivos PDF o ZIP",
        })
      }

      setFiles((prev) => [...prev, ...validFiles])
    }
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (files.length === 0) return

    setUploading(true)
    setProgress(0)

    // Simulate upload progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + 5
      })
    }, 200)

    // Simulate API call
    setTimeout(() => {
      clearInterval(interval)
      setProgress(100)

      setTimeout(() => {
        setUploading(false)
        setFiles([])
        toast("Subida completa", {
          description: `Se han subido ${files.length} facturas para procesamiento`,
        })
      }, 500)
    }, 3000)
  }

  return (
    <div className="space-y-4">
      <div
        className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          if (e.dataTransfer.files) {
            const newFiles = Array.from(e.dataTransfer.files)
            const validFiles = newFiles.filter(
              (file) =>
                file.type === "application/pdf" ||
                file.type === "application/zip" ||
                file.type === "application/x-zip-compressed",
            )

            if (validFiles.length !== newFiles.length) {
              toast("Archivos no válidos", {
                description: "Solo se permiten archivos PDF o ZIP",
              })
            }

            setFiles((prev) => [...prev, ...validFiles])
          }
        }}
      >
        <UploadCloud className="h-10 w-10 text-muted-foreground mb-2" />
        <h3 className="text-lg font-medium">Arrastra y suelta tus facturas</h3>
        <p className="text-sm text-muted-foreground mb-4">O haz clic para seleccionar archivos</p>
        <Button variant="outline" onClick={() => document.getElementById("file-upload")?.click()}>
          Seleccionar Archivos
        </Button>
        <input
          id="file-upload"
          type="file"
          className="hidden"
          accept=".pdf,.zip"
          multiple
          onChange={handleFileChange}
        />
        <p className="text-xs text-muted-foreground mt-2">Formatos soportados: PDF, ZIP</p>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Archivos seleccionados ({files.length})</h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {files.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 border rounded-md">
                <div className="flex items-center space-x-2">
                  <FileIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                  <span className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</span>
                </div>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => removeFile(index)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {uploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Subiendo facturas...</span>
            <span className="text-sm">{progress}%</span>
          </div>
          <Progress value={progress} />
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={handleUpload} disabled={files.length === 0 || uploading}>
          {uploading ? "Subiendo..." : "Subir Facturas"}
        </Button>
      </div>
    </div>
  )
}
