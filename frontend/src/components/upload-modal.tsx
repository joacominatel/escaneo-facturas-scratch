"use client"

import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Upload, X, FileText, File, AlertCircle } from 'lucide-react'
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

interface UploadModalProps {
  className?: string
}

export function UploadModal({ className }: UploadModalProps) {
  const [files, setFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isOpen, setIsOpen] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    validateAndAddFiles(selectedFiles)
  }

  const validateAndAddFiles = (selectedFiles: File[]) => {
    setError(null)
    
    const validFiles = selectedFiles.filter(file => {
      const fileType = file.type
      const fileExtension = file.name.split('.').pop()?.toLowerCase()
      
      return (
        fileType === 'application/pdf' || 
        fileExtension === 'pdf' || 
        fileType === 'application/zip' || 
        fileType === 'application/x-zip-compressed' || 
        fileExtension === 'zip'
      )
    })
    
    if (validFiles.length !== selectedFiles.length) {
      setError("Only PDF and ZIP files are allowed")
    }
    
    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles])
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

  const handleUpload = () => {
    // This would be implemented later with actual upload functionality
    console.log("Files to upload:", files)
    setIsOpen(false)
    setFiles([])
  }

  const getFileIcon = (file: File) => {
    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    
    if (fileExtension === 'pdf') {
      return <FileText className="h-5 w-5 text-red-500" />
    } else if (fileExtension === 'zip') {
      return <File className="h-5 w-5 text-blue-500" />
    }
    
    return <File className="h-5 w-5" />
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className={cn("gap-2", className)}>
          <Upload className="h-4 w-4" />
          Upload Invoices
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Invoices</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
              isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25",
              "cursor-pointer hover:border-primary/50"
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
              <p className="text-sm font-medium">
                Drag and drop files here or click to browse
              </p>
              <p className="text-xs text-muted-foreground">
                Supports PDF and ZIP files
              </p>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="h-4 w-4" />
              <p>{error}</p>
            </div>
          )}

          {files.length > 0 && (
            <div className="border rounded-md">
              <div className="p-2 bg-muted/50 border-b">
                <h3 className="text-sm font-medium">Selected Files ({files.length})</h3>
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
                        <span className="text-xs text-muted-foreground">
                          ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 rounded-full"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeFile(index)
                        }}
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
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={files.length === 0}
            >
              Upload
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
