"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle"
import { UploadModal } from "@/components/upload-modal"
import { MobileMenu } from "@/components/mobile-menu"
import { AnimatedTabs } from "@/components/animated-tabs"
import { useWebSocket } from "@/contexts/websocket-context"

// Define tab structure
const navTabs = [
  { href: "/", label: "Dashboard" },
  { href: "/history", label: "Historial" },
  { href: "/upload", label: "Subir" },
];

interface NavbarProps {
  className?: string
}

// Componente para el indicador de estado WS
const WebSocketStatusIndicator = () => {
  const { isConnected, connectError } = useWebSocket();

  let color = "bg-gray-400";
  let title = "Live Desconectado";
  
  if (isConnected) {
    color = "bg-green-500";
    title = "Live Conectado";
  } else if (connectError) {
    color = "bg-red-500";
    title = `Error Conexión Live`; // Podríamos añadir: ${connectError.message}
  } 
  // Podríamos añadir un estado "connecting" si el provider lo expusiera

  return (
    <div className="flex items-center space-x-1 sm:space-x-2" title={title}>
      <span className={cn("h-2.5 w-2.5 rounded-full animate-pulse", color, { 'animate-none': !isConnected && !connectError })}></span>
      <span className="text-xs text-muted-foreground hidden lg:inline">
        {/* Mostramos un texto más corto */} 
        {isConnected ? "Live" : (connectError ? "Error" : "Offline")}
      </span>
    </div>
  );
};

export function Navbar({ className }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false)
  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled)
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [scrolled])

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-background/90 backdrop-blur-md shadow-sm border-b border-border/50"
          : "bg-background/70 backdrop-blur-sm",
        "border-b border-transparent", // Base border for layout consistency
        className
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Left side: Mobile Menu & Animated Tabs */}
          <div className="flex items-center gap-4">
            <MobileMenu tabs={navTabs} /> {/* Pass tabs to mobile menu */}
            {/* REMOVE Logo/Brand */}
            {/* <Link href="/" className="flex items-center gap-2">
              <span className="font-bold text-xl">InvoiceApp</span>
            </Link> */}
            {/* REPLACE Nav links with AnimatedTabs */}
            <div className="hidden md:flex">
              <AnimatedTabs 
                tabs={navTabs} 
                indicatorClassName="bg-sky-500 h-0.5" // Example pastel color
                activeLinkClassName="text-sky-600 dark:text-sky-400"
                linkClassName="px-3 py-2 text-sm font-medium transition-colors duration-150 hover:text-sky-600 dark:hover:text-sky-400 relative"
              />
            </div>
          </div>

          {/* Right side: WS Status, Upload, Theme */}
          <div className="flex items-center gap-2 sm:gap-4">
            <WebSocketStatusIndicator />
            <UploadModal /> {/* Keep UploadModal button */}
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  )
}
