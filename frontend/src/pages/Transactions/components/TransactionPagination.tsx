import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 10

type TransactionPaginationProps = {
  page: number
  totalItems: number
  onPageChange: (page: number) => void
}

function getVisiblePages(currentPage: number, totalPages: number) {
  if (totalPages <= 3) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  if (currentPage <= 2) return [1, 2, 3]
  if (currentPage >= totalPages - 1) return [totalPages - 2, totalPages - 1, totalPages]
  return [currentPage - 1, currentPage, currentPage + 1]
}

export function TransactionPagination({
  page,
  totalItems,
  onPageChange,
}: TransactionPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE))
  const start = totalItems === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const end = Math.min(page * PAGE_SIZE, totalItems)
  const visiblePages = getVisiblePages(page, totalPages)

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-t border-gray-200 px-6 py-5">
      <p className="text-sm text-gray-700">
        <span className="font-medium">{start}</span>
        {' a '}
        <span className="font-medium">{end}</span>
        {' | '}
        <span className="font-medium">{totalItems}</span>
        {' resultados'}
      </p>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Página anterior"
        >
          <ChevronLeft className="size-4" />
        </Button>

        {visiblePages.map((pageNumber) => (
          <button
            key={pageNumber}
            type="button"
            onClick={() => onPageChange(pageNumber)}
            className={cn(
              'flex size-8 items-center justify-center rounded-lg text-sm font-medium transition-colors',
              pageNumber === page
                ? 'bg-brand-base text-white'
                : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
            )}
            aria-current={pageNumber === page ? 'page' : undefined}
          >
            {pageNumber}
          </button>
        ))}

        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Próxima página"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}

export { PAGE_SIZE }
