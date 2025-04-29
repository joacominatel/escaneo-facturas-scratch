"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Upload, X, FileText, File, AlertCircle, CheckCircle2 } from 'lucide-react'
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { useInvoiceUpload } from "@/hooks/use-invoice-upload"
import { Progress } from "@/components/ui/progress"

interface UploadModalProps {
  className?: string
  trigger?: React.ReactNode
}

export function UploadModal({ className, trigger }: UploadModalProps) {
  const [files, setFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  
  const { 
    uploadInvoices, 
    isUploading, 
    uploadProgress, 
    uploadResponse, 
    error: uploadError, 
    resetUpload 
  } = useInvoiceUpload()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    validateAndAddFiles(selectedFiles)
  }

  const validateAndAddFiles = (selectedFiles: File[]) => {
    setError(null)

    const validFiles = selectedFiles.filter((file) => {
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

    if (validFiles.length !== selectedFiles.length) {
      setError("Only PDF and ZIP files are allowed")
    }

    // Check if there's more than one ZIP file
    const currentZipFiles = files.filter(
      (file) => file.type === "application/zip" || file.type === "application/x-zip-compressed" || file.name.endsWith(".zip")
    )
    
    const newZipFiles = validFiles.filter(
      (file) => file.type === "application/zip" || file.type === "application/x-zip-compressed" || file.name.endsWith(".zip")
    )
    
    if (currentZipFiles.length + newZipFiles.length > 1) {
      setError("Only one ZIP file can be uploaded at a time")
      // Filter out the new ZIP files if we already have one
      if (currentZipFiles.length > 0) {
        const filteredFiles = validFiles.filter(
          (file) => !(file.type === "application/zip" || file.type === "application/x-zip-compressed" || file.name.endsWith(".zip"))
        )
        if (filteredFiles.length > 0) {
          setFiles((prev) => [...prev, ...filteredFiles])
        }
        return
      }
    }

    if (validFiles.length > 0) {
      setFiles((prev) => [...prev, ...validFiles])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const droppedFiles = Array.from(e.dataTransfer.files)
    validateAndAddFiles(droppedFiles)
  }

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (files.length === 0) {
      setError("Por favor, selecciona al menos un archivo para subir")
      return
    }
    
    const response = await uploadInvoices(files)
    
    if (response) {
      // Keep the modal open to show success state
      setTimeout(() => {
        setFiles([])
        setIsOpen(false)
        resetUpload()
      }, 3000)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    setFiles([])
    resetUpload()
    setError(null)
  }

  const getFileIcon = (file: File) => {
    const fileExtension = file.name.split(".").pop()?.toLowerCase()

    if (fileExtension === "pdf") {
      return <FileText className="h-5 w-5 text-red-500" />
    } else if (fileExtension === "zip") {
      return <File className="h-5 w-5 text-blue-500" />
    }

    return <File className="h-5 w-5" />
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className={cn("gap-2", className)}>
            <Upload className="h-4 w-4" />
            Subir Facturas
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Subir Facturas</DialogTitle>
        </DialogHeader>
        
        {uploadResponse ? (
          <div className="py-4 space-y-4">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              <p className="font-medium">Subida exitosa!</p>
            </div>
            <div className="space-y-2">
              {uploadResponse.map((item, index) => (
                <div key={index} className="p-3 bg-muted/50 rounded-md">
                  <p className="font-medium">{item.filename}</p>
                  <p className="text-sm text-muted-foreground">{item.message}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid gap-4 py-4">
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
                isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25",
                "cursor-pointer hover:border-primary/50",
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,.zip"
                multiple
                className="hidden"
              />
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium">Arrastra y suelta archivos aquí o haz click para buscar</p>
                <p className="text-xs text-muted-foreground">Soporta archivos PDF y ZIP (solo uno ZIP permitido)</p>
              </div>
            </div>

            {(error || uploadError) && (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertCircle className="h-4 w-4" />
                <p>{error || uploadError}</p>
              </div>
            )}

            {isUploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Subiendo...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            {files.length > 0 && (
              <div className="border rounded-md">
                <div className="p-2 bg-muted/50 border-b">
                  <h3 className="text-sm font-medium">Archivos seleccionados ({files.length})</h3>
                </div>
                <ul className="max-h-[200px] overflow-auto p-2">
                  <AnimatePresence>
                    {files.map((file, index) => (
                      <motion.li
                        key={`${file.name}-${index}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center justify-between py-2 px-3 text-sm hover:bg-muted/50 rounded-md"
                      >
                        <div className="flex items-center gap-2 truncate">
                          {getFileIcon(file)}
                          <span className="truncate">{file.name}</span>
                          <span className="text-xs text-muted-foreground">({(file.size / 1024).toFixed(1)} KB)</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 rounded-full"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeFile(index)
                          }}
                          disabled={isUploading}
                        >
                          <X className="h-4 w-4" />
                          <span className="sr-only">Remove file</span>
                        </Button>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose} disabled={isUploading}>
                Cancel
              </Button>
              <Button onClick={handleUpload} disabled={files.length === 0 || isUploading}>
                {isUploading ? "Subiendo..." : "Subir"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
