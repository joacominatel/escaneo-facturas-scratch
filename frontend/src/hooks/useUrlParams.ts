import { useState, useEffect, useCallback, useRef } from "react"

interface UrlParamsOptions {
  defaultValues?: Record<string, any>
  paramPrefix?: string
}

export function useUrlParams(options: UrlParamsOptions = {}) {
  const { defaultValues = {}, paramPrefix = "" } = options
  const [params, setParams] = useState<Record<string, any>>({
    ...defaultValues,
  })
  
  // Use a ref to track if this is the initial mount
  const isInitialMount = useRef(true)

  // Read URL parameters on mount
  useEffect(() => {
    if (!isInitialMount.current) {
      return; // Skip after initial mount
    }
    
    const searchParams = new URLSearchParams(window.location.search)
    const initialParams = { ...defaultValues }
    
    // Read numeric params
    if (searchParams.has(`${paramPrefix}page`)) 
      initialParams.page = Number(searchParams.get(`${paramPrefix}page`))
    
    if (searchParams.has(`${paramPrefix}per_page`)) 
      initialParams.per_page = Number(searchParams.get(`${paramPrefix}per_page`))
    
    // Read string params
    if (searchParams.has(`${paramPrefix}search`)) 
      initialParams.search = searchParams.get(`${paramPrefix}search`)
    
    if (searchParams.has(`${paramPrefix}status`)) 
      initialParams.status = searchParams.get(`${paramPrefix}status`)
    
    if (searchParams.has(`${paramPrefix}sort_by`)) 
      initialParams.sort_by = searchParams.get(`${paramPrefix}sort_by`)
    
    if (searchParams.has(`${paramPrefix}sort_order`)) 
      initialParams.sort_order = searchParams.get(`${paramPrefix}sort_order`)
    
    if (searchParams.has(`${paramPrefix}date`)) 
      initialParams.date = searchParams.get(`${paramPrefix}date`)
    
    // Set params state from URL
    setParams(initialParams)
    isInitialMount.current = false;
  }, [defaultValues, paramPrefix]);

  // Update URL and params state - removed params from deps to avoid loops
  const updateParams = useCallback((newParams: Record<string, any>) => {
    setParams(prevParams => {
      // Merge with existing params
      const updatedParams = { ...prevParams, ...newParams }
      
      // Update URL
      const searchParams = new URLSearchParams(window.location.search)
      
      // Set tab param if it exists
      if (searchParams.has("tab")) {
        const tabValue = searchParams.get("tab");
        if (!updatedParams.hasOwnProperty("tab")) {
          updatedParams.tab = tabValue;
        }
      }
      
      // Update search params
      Object.entries(updatedParams).forEach(([key, value]) => {
        if (key === "tab") {
          searchParams.set(key, String(value));
        } else if (value === undefined || value === null) {
          searchParams.delete(`${paramPrefix}${key}`);
        } else {
          searchParams.set(`${paramPrefix}${key}`, String(value));
        }
      });
      
      // Update URL without triggering navigation
      const newUrl = `${window.location.pathname}?${searchParams.toString()}`
      window.history.replaceState(null, "", newUrl);
      
      return updatedParams;
    });
    
    return newParams;
  }, [paramPrefix]);  // Removed params from dependencies

  return {
    params,
    updateParams,
  }
}