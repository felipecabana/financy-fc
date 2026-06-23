import { SquarePen, Trash2 } from 'lucide-react'

import { Card } from '@/components/ui/card'
import { type CategoryTagStyle, resolveCategoryTagStyle } from '@/lib/category-styles'
import { CategoryIcon } from '@/lib/category-icons'
import { cn } from '@/lib/utils'

export type CategoryListRow = {
  id: string
  name: string
  description?: string | null
  icon?: string | null
  color?: string | null
  itemCount: number
  totalAmount: number
}

type CategoryListProps = {
  rows: CategoryListRow[]
  variant?: 'dashboard' | 'page'
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}

type TagStyle = CategoryTagStyle

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

function formatItemCount(count: number) {
  return count === 1 ? '1 item' : `${count} itens`
}

function getTagStyle(row: CategoryListRow, index: number): TagStyle {
  return resolveCategoryTagStyle(row.color, index)
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
}

function DashboardRow({ row, index }: DashboardRowProps) {
  const tag = getTagStyle(row, index)

  return (
    <div className="flex h-7 items-center gap-3">
      <span
        className={cn(
          'inline-flex min-w-0 shrink-0 items-center gap-1.5 truncate rounded-full px-3 py-0.5 text-sm font-medium',
          tag.bg,
          tag.text,
        )}
      >
        <CategoryIcon icon={row.icon} className="size-3.5 shrink-0" />
        {row.name}
      </span>
      <span className="min-w-0 flex-1 truncate text-sm text-gray-600">
        {formatItemCount(row.itemCount)}
      </span>
      <span className="shrink-0 text-sm font-semibold text-gray-800 tabular-nums">
        {currencyFormatter.format(row.totalAmount)}
      </span>
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
  const tag = getTagStyle(row, index)

  return (
    <Card className="gap-5 rounded-xl p-[25px] shadow-none">
      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-lg',
            tag.icon,
          )}
        >
          <CategoryIcon icon={row.icon} className="size-4" />
        </div>
        <div className="flex shrink-0 gap-2">
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(row.id)}
              aria-label="Editar"
              className="flex size-8 items-center justify-center rounded-lg border border-gray-300 bg-white"
            >
              <SquarePen className="size-4 text-gray-700" />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(row.id)}
              aria-label="Excluir"
              className="flex size-8 items-center justify-center rounded-lg border border-gray-300 bg-white"
            >
              <Trash2 className="size-4 text-red-base" />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-base font-semibold text-gray-800">{row.name}</p>
        {row.description && (
          <p className="line-clamp-2 text-sm text-gray-600">{row.description}</p>
        )}
      </div>

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
        <span className="text-sm text-gray-600">{formatItemCount(row.itemCount)}</span>
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
        <DashboardRow key={row.id} row={row} index={index} />
      ))}
    </div>
  )
}
