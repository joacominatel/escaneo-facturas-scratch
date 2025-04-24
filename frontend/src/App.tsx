import HomePage from "@/pages/HomePage"
import { Toaster } from "sonner"

function App() {
  return (
    <div className="min-h-svh bg-background text-foreground transition-colors">
      <main className="pt-4">
        <HomePage />
      </main>
      <Toaster />
    </div>
  )
}

export default App
