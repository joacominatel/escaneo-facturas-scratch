"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useDebounce } from "@/hooks/use-debounce"

interface SearchBarProps {
  className?: string
  navigateTo?: string
}

export function SearchBar({ className, navigateTo = '/history' }: SearchBarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('search') || "";
  const [query, setQuery] = useState(initialQuery)
  const [isFocused, setIsFocused] = useState(false)
  const debouncedQuery = useDebounce(query, 500);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    if (debouncedQuery) {
      params.set('search', debouncedQuery)
    } else {
      params.delete('search')
    }
    params.delete('page')

    const currentSearch = searchParams.get('search') || "";
    if (debouncedQuery !== currentSearch) {
      router.push(`${navigateTo}?${params.toString()}`, { scroll: false })
    }

  }, [debouncedQuery, searchParams, router, navigateTo])

  const clearSearch = () => {
    setQuery("")
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  }

  return (
    <form 
      onSubmit={handleSubmit} 
      className={cn(
        "relative flex items-center transition-all duration-300",
        "w-full md:w-72",
        className
      )}
    >
      <Search className="absolute left-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Buscar facturas..."
        className="pl-9 pr-10 h-9 bg-background border-muted-foreground/20 focus-visible:ring-primary/20"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
      {query && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-1 h-7 w-7 rounded-full"
          onClick={clearSearch}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Limpiar búsqueda</span>
        </Button>
      )}
    </form>
  )
}
