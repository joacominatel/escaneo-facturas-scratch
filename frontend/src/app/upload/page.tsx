import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UploadModal } from "@/components/upload-modal";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  FileText,
  Upload,
  Search,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { RedirectDashboardSection } from "@/components/upload/redirect-dashboard-section";

export default function UploadPage() {
  return (
    <div className="space-y-8 mx-auto p-4 md:p-6 lg:p-8 w-full">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Subir Facturas</h1>
        <p className="text-muted-foreground">
          Subir tus facturas para procesamiento automático
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Cómo subir facturas
            </CardTitle>
            <CardDescription>
              Sigue estos pasos para subir tus facturas para procesamiento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  1
                </div>
                <div className="space-y-1">
                  <p className="font-medium">Prepara tus archivos</p>
                  <p className="text-sm text-muted-foreground">
                    Asegúrate de que tus facturas estén en formato PDF. Puedes
                    subir múltiples archivos PDF o un solo archivo ZIP que
                    contenga múltiples PDFs.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  2
                </div>
                <div className="space-y-1">
                  <p className="font-medium">Sube tus archivos</p>
                  <p className="text-sm text-muted-foreground">
                    Haz click en el botón de subir archivos o en la barra de
                    navegación. Puedes arrastrar y soltar archivos o buscar para
                    seleccionarlos.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  3
                </div>
                <div className="space-y-1">
                  <p className="font-medium">Espera a que se procesen</p>
                  <p className="text-sm text-muted-foreground">
                    Después de subir tus archivos, tus facturas serán procesadas
                    automáticamente. Esto puede tomar unos minutos dependiendo
                    del número y tamaño de los archivos.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  4
                </div>
                <div className="space-y-1">
                  <p className="font-medium">Revisa los resultados</p>
                  <p className="text-sm text-muted-foreground">
                    Una vez completado el procesamiento, puedes ver los
                    resultados en el dashboard o en la sección de historial.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-center pt-4">
              <UploadModal
                trigger={
                  <Button size="lg" className="gap-2">
                    <Upload className="h-4 w-4" />
                    Subir Facturas
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
              Verificar el estado de las facturas
            </CardTitle>
            <CardDescription>
              Cómo monitorizar y gestionar tus facturas subidas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="mt-1 rounded-full bg-green-100 p-1 dark:bg-green-900">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-medium">Procesadas</p>
                  <p className="text-sm text-muted-foreground">
                    Facturas que han sido procesadas y están listas para
                    revisión.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="mt-1 rounded-full bg-blue-100 p-1 dark:bg-blue-900">
                  <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-medium">Esperando Validación</p>
                  <p className="text-sm text-muted-foreground">
                    Facturas que han sido procesadas pero requieren validación
                    manual antes de ser finalizadas.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="mt-1 rounded-full bg-amber-100 p-1 dark:bg-amber-900">
                  <RefreshCw className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="font-medium">Procesando</p>
                  <p className="text-sm text-muted-foreground">
                    Facturas que están siendo procesadas por el sistema.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="mt-1 rounded-full bg-red-100 p-1 dark:bg-red-900">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="font-medium">Falladas</p>
                  <p className="text-sm text-muted-foreground">
                    Facturas que no pudieron ser procesadas debido a errores.
                    Estas pueden ser reintentadas.
                  </p>
                </div>
              </div>
            </div>

            <RedirectDashboardSection />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Formatos de archivo soportados</CardTitle>
          <CardDescription>
            Información sobre tipos de archivo y limitaciones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-red-500" />
                <h3 className="font-medium">PDF Files</h3>
              </div>
              <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-1">
                <li>Puedes subir múltiples archivos PDF a la vez</li>
                <li>Cada PDF debe contener una sola factura</li>
                <li>Tamaño máximo de archivo: 10MB por PDF</li>
                <li>
                  El texto en el PDF debe ser seleccionable (no imágenes
                  escaneadas)
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-500" />
                <h3 className="font-medium">ZIP Files</h3>
              </div>
              <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-1">
                <li>
                  Puedes subir un solo archivo ZIP que contenga múltiples PDFs
                </li>
                <li>Tamaño máximo de archivo: 50MB por ZIP</li>
                <li>Todos los archivos dentro del ZIP deben ser PDFs</li>
                <li>Los archivos anidados dentro del ZIP son soportados</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
