import { Lightbulb } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Building2, Wand2, FileText } from "lucide-react";

export function CompanyGuide() {
    return (
        <Card className="mb-8 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-900/30 dark:via-purple-900/30 dark:to-pink-900/30 border-purple-200 dark:border-purple-800/50 shadow-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl text-purple-800 dark:text-purple-300">
                    <Lightbulb className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    ¿Por qué crear Compañías?
                </CardTitle>
                <p className="text-sm text-muted-foreground pt-1">
                    Optimiza la extracción de datos de facturas recurrentes de un mismo origen.
                </p>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
                <div className="flex items-start gap-3 p-3 bg-white/50 dark:bg-black/20 rounded-lg border border-white dark:border-gray-700/50">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700/50">
                        <Building2 className="h-4 w-4" />
                    </div>
                    <div>
                        <p className="font-medium text-blue-900 dark:text-blue-200">Identifica Proveedores/Clientes</p>
                        <p className="text-muted-foreground text-xs">
                            Agrupa facturas que provienen del mismo lugar (por ejemplo, un proveedor específico).
                        </p>
                    </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-white/50 dark:bg-black/20 rounded-lg border border-white dark:border-gray-700/50">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700/50">
                        <Wand2 className="h-4 w-4" />
                    </div>
                    <div>
                        <p className="font-medium text-green-900 dark:text-green-200">Prompts Personalizados</p>
                        <p className="text-muted-foreground text-xs">
                            Cada compañía tiene su propio "prompt" (instrucciones para la IA), adaptado a la estructura única de sus facturas.
                        </p>
                    </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-white/50 dark:bg-black/20 rounded-lg border border-white dark:border-gray-700/50">
                     <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pink-100 dark:bg-pink-900/50 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-700/50">
                        <FileText className="h-4 w-4" />
                    </div>
                    <div>
                        <p className="font-medium text-pink-900 dark:text-pink-200">Mayor Precisión</p>
                        <p className="text-muted-foreground text-xs">
                            Al usar un prompt específico, la IA extrae los datos (importes, fechas, ítems) con más exactitud.
                        </p>
                    </div>
                </div>
                 <p className="text-xs text-center pt-2 text-muted-foreground">Al subir una factura, podrás asociarla a una compañía existente.</p>
            </CardContent>
        </Card>
    );
}
