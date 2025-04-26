import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { UploadModal } from "@/components/upload-modal"
import { Button } from "@/components/ui/button"
import { CheckCircle, FileText, Upload, Search, RefreshCw, AlertCircle } from 'lucide-react'

export default function UploadPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Upload Invoices</h1>
        <p className="text-muted-foreground">Upload your invoices for automatic processing</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              How to Upload Invoices
            </CardTitle>
            <CardDescription>Follow these steps to upload your invoices for processing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  1
                </div>
                <div className="space-y-1">
                  <p className="font-medium">Prepare your files</p>
                  <p className="text-sm text-muted-foreground">
                    Ensure your invoices are in PDF format. You can upload multiple PDF files or a single ZIP file
                    containing multiple PDFs.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  2
                </div>
                <div className="space-y-1">
                  <p className="font-medium">Upload your files</p>
                  <p className="text-sm text-muted-foreground">
                    Click the upload button below or in the navigation bar. You can drag and drop files or browse to select
                    them.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  3
                </div>
                <div className="space-y-1">
                  <p className="font-medium">Wait for processing</p>
                  <p className="text-sm text-muted-foreground">
                    After uploading, your invoices will be automatically processed. This may take a few moments depending
                    on the number and size of files.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  4
                </div>
                <div className="space-y-1">
                  <p className="font-medium">Check the results</p>
                  <p className="text-sm text-muted-foreground">
                    Once processing is complete, you can view the results in the dashboard or history section.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-center pt-4">
              <UploadModal
                trigger={
                  <Button size="lg" className="gap-2">
                    <Upload className="h-4 w-4" />
                    Upload Invoices
                  </Button>
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Checking Invoice Status
            </CardTitle>
            <CardDescription>How to monitor and manage your uploaded invoices</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="mt-1 rounded-full bg-green-100 p-1 dark:bg-green-900">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-medium">Processed</p>
                  <p className="text-sm text-muted-foreground">
                    Invoices that have been successfully processed and are ready for review.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="mt-1 rounded-full bg-blue-100 p-1 dark:bg-blue-900">
                  <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-medium">Waiting Validation</p>
                  <p className="text-sm text-muted-foreground">
                    Invoices that have been processed but require manual validation before being finalized.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="mt-1 rounded-full bg-amber-100 p-1 dark:bg-amber-900">
                  <RefreshCw className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="font-medium">Processing</p>
                  <p className="text-sm text-muted-foreground">
                    Invoices that are currently being processed by the system.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="mt-1 rounded-full bg-red-100 p-1 dark:bg-red-900">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="font-medium">Failed</p>
                  <p className="text-sm text-muted-foreground">
                    Invoices that could not be processed due to errors. These can be retried.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-md bg-muted p-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                <p className="font-medium">View all invoices in the Dashboard</p>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                You can view all your invoices, their status, and take actions on them from the main dashboard or history
                page.
              </p>
              <div className="mt-4">
                <Button variant="outline" className="w-full">
                  Go to Dashboard
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Supported File Formats</CardTitle>
          <CardDescription>Information about file types and limitations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-red-500" />
                <h3 className="font-medium">PDF Files</h3>
              </div>
              <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-1">
                <li>You can upload multiple PDF files at once</li>
                <li>Each PDF should contain a single invoice</li>
                <li>Maximum file size: 10MB per PDF</li>
                <li>Text in the PDF should be selectable (not scanned images)</li>
              </ul>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-500" />
                <h3 className="font-medium">ZIP Files</h3>
              </div>
              <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-1">
                <li>You can upload a single ZIP file containing multiple PDFs</li>
                <li>Maximum file size: 50MB per ZIP</li>
                <li>All files within the ZIP must be PDFs</li>
                <li>Nested folders within the ZIP are supported</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
