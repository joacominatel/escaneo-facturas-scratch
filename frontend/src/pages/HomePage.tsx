"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Header } from "@/components/Home/header"
import { Dashboard } from "@/components/Home/dashboard"
import { UploadTab } from "@/components/Home/upload-tab"
import { UploadHistory } from "@/components/History/invoice-page"
import { useTabNavigation } from "@/hooks/useTabNavigation"

export default function HomePage() {
  const { activeTab } = useTabNavigation("overview")

  return (
    <div className="flex min-h-screen w-full flex-col">
      <main className="flex-1">
        <div className="grid items-start gap-6 pb-8 pt-6 md:py-8 px-6">
          <Header activeTab={activeTab} />

          <Tabs value={activeTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview" asChild>
                <a href="?tab=overview">Resumen</a>
              </TabsTrigger>
              <TabsTrigger value="upload" asChild>
                <a href="?tab=upload">Subir Facturas</a>
              </TabsTrigger>
              <TabsTrigger value="history" asChild>
                <a href="?tab=history">Historial</a>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Dashboard />
            </TabsContent>

            <TabsContent value="upload" className="space-y-4">
              <UploadTab />
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <UploadHistory />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
