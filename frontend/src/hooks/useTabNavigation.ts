import { useState, useEffect } from "react"

export function useTabNavigation(defaultTab: string = "overview") {
  const searchParams = new URLSearchParams(window.location.search)
  const tabParam = searchParams.get("tab")
  const [activeTab, setActiveTab] = useState(defaultTab)

  // Sync the active tab with the URL parameter
  useEffect(() => {
    if (tabParam && ["overview", "upload", "history"].includes(tabParam)) {
      setActiveTab(tabParam)
    }
  }, [tabParam])

  return { activeTab }
}