import { Inter } from 'next/font/google'
import "./globals.css"
import { Navbar } from "@/components/navbar"
import { ThemeProvider } from "@/contexts/theme-context"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <div className="min-h-screen bg-background">
            <Navbar />
            <main className="mx-auto px-4 pt-24 pb-8">
              {children}
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
