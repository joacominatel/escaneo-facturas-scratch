import { Inter } from 'next/font/google'
import "./globals.css"
import { Navbar } from "@/components/navbar"
import { ThemeProvider } from "@/contexts/theme-context"
import { WebSocketProvider } from "@/contexts/websocket-context"
import { Toaster } from 'sonner'
import { Metadata } from 'next'

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: 'Invoice Scanner',
  description: 'Invoice Scanner',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <WebSocketProvider>
            <div className="min-h-screen bg-background">
              <Navbar />
              <main className="mx-auto px-4 pt-24 pb-8">
                {children}
              </main>
            </div>
            <Toaster />
          </WebSocketProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
