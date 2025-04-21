import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { motion } from "framer-motion"

export function Navbar() {
  return (
    <motion.header
      className="w-full border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30"
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <nav className="container mx-auto flex items-center justify-between h-16 px-4">
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg tracking-tight text-primary">FacturaScan</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => toast.success("Funcionalidad próximamente disponible")}
          >
            Ayuda
          </Button>
        </div>
      </nav>
    </motion.header>
  )
}
