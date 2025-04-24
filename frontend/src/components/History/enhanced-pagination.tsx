"use client"

import { useCallback } from "react"
import { toast } from "sonner"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { cn } from "@/lib/utils"

interface EnhancedPaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

export function EnhancedPagination({ currentPage, totalPages, onPageChange, className }: EnhancedPaginationProps) {
  const handlePageChange = useCallback(
    (page: number) => {
      if (page !== currentPage) {
        onPageChange(page)
        toast.success(`Página ${page}`, {
          description: `Mostrando página ${page} de ${totalPages}`,
          duration: 2000,
        })
      }
    },
    [currentPage, onPageChange, totalPages],
  )

  // Generar array de páginas a mostrar
  const getPageNumbers = useCallback(() => {
    const pageNumbers: (number | "ellipsis")[] = []

    // Siempre mostrar la primera página
    pageNumbers.push(1)

    // Calcular rango de páginas alrededor de la página actual
    const rangeStart = Math.max(2, currentPage - 1)
    const rangeEnd = Math.min(totalPages - 1, currentPage + 1)

    // Añadir elipsis si hay un salto entre la primera página y el inicio del rango
    if (rangeStart > 2) {
      pageNumbers.push("ellipsis")
    }

    // Añadir páginas del rango
    for (let i = rangeStart; i <= rangeEnd; i++) {
      pageNumbers.push(i)
    }

    // Añadir elipsis si hay un salto entre el final del rango y la última página
    if (rangeEnd < totalPages - 1) {
      pageNumbers.push("ellipsis")
    }

    // Añadir la última página si hay más de una página
    if (totalPages > 1) {
      pageNumbers.push(totalPages)
    }

    return pageNumbers
  }, [currentPage, totalPages])

  const pageNumbers = getPageNumbers()

  if (totalPages <= 1) return null

  return (
    <Pagination className={cn("w-full flex justify-end", className)}>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
            className="transition-transform hover:-translate-x-1"
          />
        </PaginationItem>

        {pageNumbers.map((page, index) => (
          <PaginationItem key={index}>
            {page === "ellipsis" ? (
              <span className="flex h-9 w-9 items-center justify-center text-sm">...</span>
            ) : (
              <PaginationLink
                isActive={page === currentPage}
                onClick={() => handlePageChange(page)}
                className={cn("transition-all duration-200", page === currentPage ? "font-bold" : "hover:scale-110")}
              >
                {page}
              </PaginationLink>
            )}
          </PaginationItem>
        ))}

        <PaginationItem>
          <PaginationNext
            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
            className="transition-transform hover:translate-x-1"
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}
