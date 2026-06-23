import { cn } from '@/lib/utils'

export type CategoryListRow = {
  id: string
  name: string
  itemCount: number
  totalAmount: number
}

type CategoryListProps = {
  rows: CategoryListRow[]
  onEdit?: (id: string) => void
}

const tagVariants = [
  { bg: 'bg-blue-light', text: 'text-blue-dark' },
  { bg: 'bg-purple-light', text: 'text-purple-dark' },
  { bg: 'bg-orange-light', text: 'text-orange-dark' },
  { bg: 'bg-pink-light', text: 'text-pink-dark' },
  { bg: 'bg-yellow-light', text: 'text-yellow-dark' },
  { bg: 'bg-green-light', text: 'text-green-dark' },
] as const

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

function formatItemCount(count: number) {
  return count === 1 ? '1 item' : `${count} itens`
}

export function CategoryList({ rows, onEdit }: CategoryListProps) {
  if (rows.length === 0) {
    return (
      <p className="px-6 py-8 text-center text-sm text-gray-500">
        Nenhuma categoria cadastrada.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-5 p-6">
      {rows.map((row, index) => {
        const tag = tagVariants[index % tagVariants.length]!

        return (
          <div key={row.id} className="flex items-center gap-1">
            <span
              className={cn(
                'shrink-0 rounded-full px-3 py-1 text-sm font-medium',
                tag.bg,
                tag.text,
              )}
            >
              {row.name}
            </span>
            <span className="min-w-0 flex-1 text-right text-sm text-gray-600">
              {formatItemCount(row.itemCount)}
            </span>
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(row.id)}
                className="shrink-0 text-sm font-medium text-brand-base"
              >
                Editar
              </button>
            )}
            <span className="w-[88px] shrink-0 text-right text-sm font-semibold text-gray-800">
              {currencyFormatter.format(row.totalAmount)}
            </span>
          </div>
        )
      })}
    </div>
  )
}
