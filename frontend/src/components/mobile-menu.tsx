"use client"

import { useState } from "react"
import { Menu, X } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ThemeToggle } from "@/components/theme-toggle"
import { UploadModal } from "@/components/upload-modal"
import { Upload } from "lucide-react"

interface Tab {
  href: string;
  label: string;
}

interface MobileMenuProps {
  className?: string;
  tabs: Tab[];
}

export function MobileMenu({ className, tabs }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className={cn("md:hidden", className)}>
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex flex-col pt-10">
        <nav className="flex flex-col gap-1 py-4">
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              onClick={() => setIsOpen(false)}
              className={cn(
                "px-4 py-2.5 rounded-md text-base font-medium transition-colors duration-150",
                pathname === tab.href
                  ? "bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto border-t pt-4 space-y-4 px-4">
          <UploadModal 
            trigger={(
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2" 
                onClick={() => setIsOpen(false)}
              >
                <Upload className="h-4 w-4" />
                <span>Subir Facturas</span>
              </Button>
            )}
          />
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Tema</span>
            <ThemeToggle />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
