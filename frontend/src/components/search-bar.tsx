"use client"

import { useState } from "react"
import { Search, X } from 'lucide-react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface SearchBarProps {
  className?: string
  onSearch?: (query: string) => void
}

export function SearchBar({ className, onSearch }: SearchBarProps) {
  const [query, setQuery] = useState("")
  const [isFocused, setIsFocused] = useState(false)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (onSearch) {
      onSearch(query)
    }
  }

  const clearSearch = () => {
    setQuery("")
    if (onSearch) {
      onSearch("")
    }
  }

  return (
    <form 
      onSubmit={handleSearch} 
      className={cn(
        "relative flex items-center transition-all duration-300",
        isFocused ? "w-full md:w-80" : "w-full md:w-64",
        className
      )}
    >
      <Search className="absolute left-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Search invoices..."
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
          <span className="sr-only">Clear search</span>
        </Button>
      )}
    </form>
  )
}
