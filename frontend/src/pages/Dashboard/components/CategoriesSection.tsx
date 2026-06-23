import { ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'

import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type CategoriesSectionProps = {
  children?: ReactNode
  className?: string
  loading: boolean
}

function SectionSkeleton() {
  return (
    <div className="divide-y divide-gray-200">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={`category-skeleton-${i}`} className="flex h-[72px] items-center justify-between px-6">
          <div className="h-6 w-24 animate-pulse rounded-full bg-gray-200" />
          <div className="flex flex-col items-end gap-2">
            <div className="h-3 w-16 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function CategoriesSection({ children, className, loading }: CategoriesSectionProps) {
  return (
    <Card className={cn('col-span-1 gap-0 overflow-hidden rounded-xl p-0 shadow-none', className)}>
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
        <span className="text-xs font-medium tracking-wide text-gray-500 uppercase">Categorias</span>
        <button type="button" className="flex items-center gap-1 text-sm font-medium text-brand-base">
          Gerenciar
          <ChevronRight className="size-5" />
        </button>
      </div>

      <div className="min-h-[200px]">
        {loading ? <SectionSkeleton /> : children}
      </div>
    </Card>
  )
}
