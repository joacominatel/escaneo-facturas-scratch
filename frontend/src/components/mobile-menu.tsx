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

interface MobileMenuProps {
  className?: string
}

export function MobileMenu({ className }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  const routes = [
    { href: "/", label: "Dashboard" },
    { href: "/history", label: "History" },
    { href: "/upload", label: "Upload" },
  ]

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className={cn("md:hidden", className)}>
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex flex-col">
        <div className="flex items-center justify-between border-b pb-4">
          <span className="font-semibold text-lg">Menu</span>
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
            <X className="h-5 w-5" />
            <span className="sr-only">Close menu</span>
          </Button>
        </div>
        <nav className="flex flex-col gap-1 py-4">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              onClick={() => setIsOpen(false)}
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                pathname === route.href
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              )}
            >
              {route.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto space-y-4">
          <UploadModal className="w-full" />
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Theme</span>
            <ThemeToggle />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
