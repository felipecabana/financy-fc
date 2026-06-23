import { ChevronRight, Plus } from 'lucide-react'
import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type TransactionsSectionProps = {
  children?: ReactNode
  className?: string
  loading: boolean
  onNewTransaction?: () => void
}

function SectionSkeleton() {
  return (
    <div className="divide-y divide-gray-200">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={`transaction-skeleton-${i}`} className="flex h-20 items-center gap-4 px-6">
          <div className="size-10 animate-pulse rounded-lg bg-gray-200" />
          <div className="flex flex-1 flex-col gap-2">
            <div className="h-4 w-48 animate-pulse rounded bg-gray-200" />
            <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function TransactionsSection({
  children,
  className,
  loading,
  onNewTransaction,
}: TransactionsSectionProps) {
  return (
    <Card className={cn('col-span-1 gap-0 overflow-hidden rounded-xl p-0 shadow-none lg:col-span-2', className)}>
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
        <span className="text-xs font-medium tracking-wide text-gray-500 uppercase">
          Transações recentes
        </span>
        <button type="button" className="flex items-center gap-1 text-sm font-medium text-brand-base">
          Ver todas
          <ChevronRight className="size-5" />
        </button>
      </div>

      <div className="min-h-[200px]">
        {loading ? <SectionSkeleton /> : children}
      </div>

      <div className="flex justify-center border-t border-gray-200 py-5">
        <Button
          type="button"
          variant="link"
          className="h-auto gap-1 px-0 text-sm font-medium"
          onClick={onNewTransaction}
        >
          <Plus className="size-5" />
          Nova transação
        </Button>
      </div>
    </Card>
  )
}
