"use client"

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
} from "@/components/ui/pagination"
import { toast } from "sonner"

interface InvoicePaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function InvoicePagination({ currentPage, totalPages, onPageChange }: InvoicePaginationProps) {
  return (
    <Pagination className="w-full flex justify-end">
      <PaginationContent>
        <PaginationItem>
          <PaginationNext
            onClick={() => {
              onPageChange(Math.max(1, currentPage - 1))
              toast.success(`Página ${Math.max(1, currentPage - 1)}`)
            }}
            className="transition-transform hover:-translate-x-1"
          />
        </PaginationItem>

        {/* Mostrar primera página */}
        {currentPage > 2 && (
          <PaginationItem>
            <PaginationLink
              onClick={() => {
                onPageChange(1)
                toast.success(`Página 1`)
              }}
              className="transition-transform hover:scale-110"
            >
              1
            </PaginationLink>
          </PaginationItem>
        )}

        {/* Mostrar elipsis si hay muchas páginas */}
        {currentPage > 3 && (
          <PaginationItem>
            <PaginationLink>...</PaginationLink>
          </PaginationItem>
        )}

        {/* Mostrar página anterior si no es la primera */}
        {currentPage > 1 && (
          <PaginationItem>
            <PaginationLink
              onClick={() => {
                onPageChange(currentPage - 1)
                toast.success(`Página ${currentPage - 1}`)
              }}
              className="transition-transform hover:scale-110"
            >
              {currentPage - 1}
            </PaginationLink>
          </PaginationItem>
        )}

        {/* Página actual */}
        <PaginationItem>
          <PaginationLink isActive className="transition-transform hover:scale-110">
            {currentPage}
          </PaginationLink>
        </PaginationItem>

        {/* Mostrar página siguiente si no es la última */}
        {currentPage < totalPages && (
          <PaginationItem>
            <PaginationLink
              onClick={() => {
                onPageChange(currentPage + 1)
                toast.success(`Página ${currentPage + 1}`)
              }}
              className="transition-transform hover:scale-110"
            >
              {currentPage + 1}
            </PaginationLink>
          </PaginationItem>
        )}

        {/* Mostrar elipsis si hay muchas páginas */}
        {currentPage < totalPages - 2 && (
          <PaginationItem>
            <PaginationLink>...</PaginationLink>
          </PaginationItem>
        )}

        {/* Mostrar última página */}
        {currentPage < totalPages - 1 && (
          <PaginationItem>
            <PaginationLink
              onClick={() => {
                onPageChange(totalPages)
                toast.success(`Página ${totalPages}`)
              }}
              className="transition-transform hover:scale-110"
            >
              {totalPages}
            </PaginationLink>
          </PaginationItem>
        )}

        <PaginationItem>
          <PaginationNext
            onClick={() => {
              onPageChange(Math.min(totalPages, currentPage + 1))
              toast.success(`Página ${Math.min(totalPages, currentPage + 1)}`)
            }}
            className="transition-transform hover:translate-x-1"
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}
