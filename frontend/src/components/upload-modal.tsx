"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Upload, X, FileText, AlertCircle, CheckCircle2, Building, Loader2 } from 'lucide-react'
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { useInvoiceUpload, GENERIC_COMPANY_ID } from "@/hooks/use-invoice-upload"
import { useCompanies } from "@/hooks/companies/use-companies"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"

interface UploadModalProps {
  className?: string
  trigger?: React.ReactNode
}

const LOCAL_STORAGE_COMPANY_KEY = 'selectedCompanyIdForUpload';

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

  const { companies, isLoading: isLoadingCompanies, error: companiesError } = useCompanies()

  const [selectedCompanyId, setSelectedCompanyId] = useLocalStorage<string | number>(
      LOCAL_STORAGE_COMPANY_KEY, 
      GENERIC_COMPANY_ID
  );

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
        fileExtension === "pdf"
      )
    })

    if (validFiles.length !== selectedFiles.length) {
      setError("Solo se permiten archivos PDF")
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
      setError("Por favor, selecciona al menos un archivo PDF para subir")
      return
    }
    setError(null);

    const companyIdToSend = selectedCompanyId === GENERIC_COMPANY_ID ? undefined : Number(selectedCompanyId);

    const response = await uploadInvoices(files, companyIdToSend)
    
    if (response) {
      setTimeout(() => {
        setIsOpen(false)
        setFiles([])
        resetUpload()
      }, 3000)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    setTimeout(() => {
        setFiles([])
        resetUpload()
        setError(null)
    }, 300)
  }

  const getFileIcon = (file: File) => {
    return <FileText className="h-5 w-5 text-red-500" />
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); else setIsOpen(true); }}>
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
          <DialogTitle>Subir Facturas PDF</DialogTitle>
        </DialogHeader>
        
        {uploadResponse ? (
          <div className="py-4 space-y-4">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              <p className="font-medium">Subida completada</p>
            </div>
            <div className="space-y-2 max-h-[300px] overflow-auto pr-2">
              {uploadResponse.map((item, index) => (
                <div key={index} className={`p-3 rounded-md border ${item.status === 'error' || item.status === 'duplicated' ? 'bg-destructive/10 border-destructive/30' : 'bg-muted/50'}`}>
                  <p className="font-medium break-words">{item.filename}</p>
                  <p className={`text-sm ${item.status === 'error' || item.status === 'duplicated' ? 'text-destructive' : 'text-muted-foreground'}`}>{item.message}</p>
                  {item.status !== 'error' && item.status !== 'duplicated' && item.invoice_id !== null && (
                      <p className="text-xs text-muted-foreground mt-1">ID: {item.invoice_id} - Estado: {item.status}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
                <Label htmlFor="company-select">Asociar a Compañía (Opcional)</Label>
                <Select 
                    value={String(selectedCompanyId)} 
                    onValueChange={(value) => setSelectedCompanyId(value === GENERIC_COMPANY_ID ? GENERIC_COMPANY_ID : Number(value))}
                    disabled={isLoadingCompanies || isUploading}
                >
                    <SelectTrigger id="company-select" className="w-full">
                        <SelectValue placeholder="Seleccionar compañía..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={GENERIC_COMPANY_ID}>Genérico (Sin Compañía)</SelectItem>
                        {companiesError && <p className='text-xs text-destructive p-2'>Error al cargar</p>}
                        {isLoadingCompanies && <div className='flex justify-center p-2'><Loader2 className="h-4 w-4 animate-spin"/></div>}
                        {!isLoadingCompanies && !companiesError && companies.map((company) => (
                            <SelectItem key={company.id} value={String(company.id)}>
                                {company.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
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
                accept=".pdf"
                multiple
                className="hidden"
              />
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium">Arrastra y suelta archivos PDF aquí o haz click</p>
                <p className="text-xs text-muted-foreground">Soporta solo archivos PDF</p>
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
                        key={`${file.name}-${index}-${file.size}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center justify-between py-2 px-3 text-sm hover:bg-muted/50 rounded-md"
                      >
                        <div className="flex items-center gap-2 truncate">
                          {getFileIcon(file)}
                          <span className="truncate" title={file.name}>{file.name}</span>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">({(file.size / 1024).toFixed(1)} KB)</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 rounded-full flex-shrink-0"
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

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={handleClose} disabled={isUploading}>
                Cancelar
              </Button>
              <Button onClick={handleUpload} disabled={files.length === 0 || isUploading}>
                {isUploading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Subiendo...
                    </>
                ) : `Subir ${files.length} archivo${files.length !== 1 ? 's' : ''}`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
