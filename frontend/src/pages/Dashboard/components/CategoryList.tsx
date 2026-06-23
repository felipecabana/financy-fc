import { Tag } from 'lucide-react'

import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export type CategoryListRow = {
  id: string
  name: string
  itemCount: number
  totalAmount: number
}

type CategoryListProps = {
  rows: CategoryListRow[]
  variant?: 'dashboard' | 'page'
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}

const tagVariants = [
  { bg: 'bg-blue-light', text: 'text-blue-dark', icon: 'bg-blue-light text-blue-dark' },
  { bg: 'bg-purple-light', text: 'text-purple-dark', icon: 'bg-purple-light text-purple-dark' },
  { bg: 'bg-orange-light', text: 'text-orange-dark', icon: 'bg-orange-light text-orange-dark' },
  { bg: 'bg-pink-light', text: 'text-pink-dark', icon: 'bg-pink-light text-pink-dark' },
  { bg: 'bg-yellow-light', text: 'text-yellow-dark', icon: 'bg-yellow-light text-yellow-dark' },
  { bg: 'bg-green-light', text: 'text-green-dark', icon: 'bg-green-light text-green-dark' },
] as const

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

function formatItemCount(count: number) {
  return count === 1 ? '1 item' : `${count} itens`
}

function EmptyState() {
  return (
    <p className="px-6 py-8 text-center text-sm text-gray-500">
      Nenhuma categoria cadastrada.
    </p>
  )
}

type DashboardRowProps = {
  row: CategoryListRow
  index: number
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}

function DashboardRow({ row, index, onEdit, onDelete }: DashboardRowProps) {
  const tag = tagVariants[index % tagVariants.length]!

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-3">
        <span
          className={cn(
            'min-w-0 truncate rounded-full px-3 py-0.5 text-sm font-medium',
            tag.bg,
            tag.text,
          )}
        >
          {row.name}
        </span>
        <span className="shrink-0 text-sm font-semibold text-gray-800 tabular-nums">
          {currencyFormatter.format(row.totalAmount)}
        </span>
      </div>

      <div className="flex items-center justify-between gap-3">
        <span className="shrink-0 text-sm text-gray-600">{formatItemCount(row.itemCount)}</span>
        <div className="flex shrink-0 items-center gap-3">
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(row.id)}
              className="text-sm font-medium text-brand-base"
            >
              Editar
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(row.id)}
              className="text-sm font-medium text-brand-base"
            >
              Excluir
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

type PageCardProps = {
  row: CategoryListRow
  index: number
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}

function PageCard({ row, index, onEdit, onDelete }: PageCardProps) {
  const tag = tagVariants[index % tagVariants.length]!

  return (
    <Card className="gap-5 rounded-xl p-6 shadow-none">
      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-lg',
            tag.icon,
          )}
        >
          <Tag className="size-4" />
        </div>
        <div className="flex shrink-0 gap-2">
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(row.id)}
              className="text-sm font-medium text-brand-base"
            >
              Excluir
            </button>
          )}
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(row.id)}
              className="text-sm font-medium text-brand-base"
            >
              Editar
            </button>
          )}
        </div>
      </div>

      <p className="text-base font-semibold text-gray-800">{row.name}</p>

      <div className="flex items-center justify-between gap-3">
        <span
          className={cn(
            'rounded-full px-3 py-1 text-sm font-medium',
            tag.bg,
            tag.text,
          )}
        >
          {row.name}
        </span>
        <div className="text-right">
          <p className="text-sm text-gray-600">{formatItemCount(row.itemCount)}</p>
          <p className="text-sm font-semibold text-gray-800">
            {currencyFormatter.format(row.totalAmount)}
          </p>
        </div>
      </div>
    </Card>
  )
}

export function CategoryList({
  rows,
  variant = 'dashboard',
  onEdit,
  onDelete,
}: CategoryListProps) {
  if (rows.length === 0) {
    return <EmptyState />
  }

  if (variant === 'page') {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {rows.map((row, index) => (
          <PageCard
            key={row.id}
            row={row}
            index={index}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4 sm:gap-5 sm:p-6">
      {rows.map((row, index) => (
        <DashboardRow
          key={row.id}
          row={row}
          index={index}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
