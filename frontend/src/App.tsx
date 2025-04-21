import HomePage from "@/pages/HomePage"
import { Navbar } from "@/components/Navbar"

function App() {
  return (
    <div className="min-h-svh bg-background text-foreground transition-colors">
      <Navbar />
      <main className="pt-4">
        <HomePage />
      </main>
    </div>
  )
}

export default App
