"use client"

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

interface InvoicePaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function InvoicePagination({ currentPage, totalPages, onPageChange }: InvoicePaginationProps) {
  return (
    <Pagination className="w-full flex justify-end">
      <PaginationContent>
        <PaginationItem className={currentPage <= 1 ? "pointer-events-none opacity-50" : undefined}>
          <PaginationPrevious onClick={() => onPageChange(Math.max(1, currentPage - 1))} />
        </PaginationItem>

        {/* Mostrar primera página */}
        {currentPage > 2 && (
          <PaginationItem>
            <PaginationLink onClick={() => onPageChange(1)}>1</PaginationLink>
          </PaginationItem>
        )}

        {/* Mostrar elipsis si hay muchas páginas */}
        {currentPage > 3 && (
          <PaginationItem className="pointer-events-none opacity-50">
            <PaginationLink>...</PaginationLink>
          </PaginationItem>
        )}

        {/* Mostrar página anterior si no es la primera */}
        {currentPage > 1 && (
          <PaginationItem>
            <PaginationLink onClick={() => onPageChange(currentPage - 1)}>{currentPage - 1}</PaginationLink>
          </PaginationItem>
        )}

        {/* Página actual */}
        <PaginationItem>
          <PaginationLink isActive>{currentPage}</PaginationLink>
        </PaginationItem>

        {/* Mostrar página siguiente si no es la última */}
        {currentPage < totalPages && (
          <PaginationItem>
            <PaginationLink onClick={() => onPageChange(currentPage + 1)}>{currentPage + 1}</PaginationLink>
          </PaginationItem>
        )}

        {/* Mostrar elipsis si hay muchas páginas */}
        {currentPage < totalPages - 2 && (
          <PaginationItem className="pointer-events-none opacity-50">
            <PaginationLink>...</PaginationLink>
          </PaginationItem>
        )}

        {/* Mostrar última página */}
        {currentPage < totalPages - 1 && (
          <PaginationItem>
            <PaginationLink onClick={() => onPageChange(totalPages)}>{totalPages}</PaginationLink>
          </PaginationItem>
        )}

        <PaginationItem className={currentPage >= totalPages ? "pointer-events-none opacity-50" : undefined}>
          <PaginationNext
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}
