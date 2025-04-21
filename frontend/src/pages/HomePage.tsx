import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

export default function HomePage() {
  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-svh gap-8 px-4"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.h1
        className="text-4xl font-bold text-primary mb-2 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        Escaneo y Procesamiento de Facturas
      </motion.h1>
      <p className="text-muted-foreground max-w-xl text-center">
        Sube tus facturas en PDF o ZIP y procesa automáticamente su información clave. Valida el resumen antes de confirmar el procesamiento completo.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md justify-center">
        <Button
          className="w-full sm:w-auto"
          variant="default"
          size="lg"
          onClick={() => console.log("Subir archivo")}
        >
          Subir Factura
        </Button>
        <Button
          className="w-full sm:w-auto"
          variant="secondary"
          size="lg"
          onClick={() => console.log("Ver facturas")}
        >
          Ver Facturas
        </Button>
      </div>
      <div className="w-full max-w-md mt-8">
        {/* Aquí irá el componente de upload en el futuro */}
        <div className="border border-dashed border-border rounded-lg p-6 text-center text-muted-foreground bg-muted/30 dark:bg-muted/60">
          Arrastra y suelta tus archivos aquí o haz click en "Subir Factura".
        </div>
      </div>
    </motion.div>
  )
}
