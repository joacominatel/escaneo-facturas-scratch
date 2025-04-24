"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileUploadArea } from "@/components/Home/file-upload-area"

export function UploadTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Subir Facturas</CardTitle>
        <CardDescription>Sube archivos PDF o ZIP con facturas para procesamiento automático</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FileUploadArea />
      </CardContent>
    </Card>
  )
}