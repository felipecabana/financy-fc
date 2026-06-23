import { CircleArrowDown, CircleArrowUp, Receipt } from 'lucide-react'
import { useSyncExternalStore } from 'react'

import { cn } from '@/lib/utils'
import type { Transaction } from '@/types'

type TransactionListProps = {
  transactions: Transaction[]
  variant?: 'dashboard' | 'page'
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}

const RECENT_LIMIT = 5

const tagVariants = [
  { bg: 'bg-blue-light', text: 'text-blue-dark', icon: 'bg-blue-light text-blue-dark' },
  { bg: 'bg-purple-light', text: 'text-purple-dark', icon: 'bg-purple-light text-purple-dark' },
  { bg: 'bg-orange-light', text: 'text-orange-dark', icon: 'bg-orange-light text-orange-dark' },
  { bg: 'bg-pink-light', text: 'text-pink-dark', icon: 'bg-pink-light text-pink-dark' },
  { bg: 'bg-yellow-light', text: 'text-yellow-dark', icon: 'bg-yellow-light text-yellow-dark' },
] as const

const incomeTag = {
  bg: 'bg-green-light',
  text: 'text-green-dark',
  icon: 'bg-green-light text-green-dark',
}

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

function isIncome(type: string) {
  return type.toLowerCase() === 'receita'
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  }).format(new Date(iso))
}

function formatAmount(transaction: Transaction) {
  const formatted = currencyFormatter.format(Math.abs(transaction.amount))
  return isIncome(transaction.type) ? `+ ${formatted}` : `- ${formatted}`
}

function getTagLabel(transaction: Transaction) {
  if (transaction.category?.name) return transaction.category.name
  return isIncome(transaction.type) ? 'Receita' : 'Despesa'
}

function getTypeLabel(type: string) {
  return isIncome(type) ? 'Entrada' : 'Saída'
}

function getRowStyle(transaction: Transaction, index: number) {
  if (isIncome(transaction.type) && !transaction.category?.name) {
    return incomeTag
  }

  return tagVariants[index % tagVariants.length]!
}

function sortTransactions(transactions: Transaction[]) {
  return [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  )
}

function subscribeLargeScreen(onChange: () => void) {
  if (typeof window.matchMedia !== 'function') return () => undefined

  const media = window.matchMedia('(min-width: 1024px)')
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}

function isLargeScreen() {
  if (typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(min-width: 1024px)').matches
}

function useIsLargeScreen() {
  return useSyncExternalStore(subscribeLargeScreen, isLargeScreen, () => false)
}

function EmptyState() {
  return (
    <p className="px-6 py-8 text-center text-sm text-gray-500">Nenhuma transação cadastrada.</p>
  )
}

function PageTableHeader() {
  return (
    <div className="flex border-b border-gray-200 bg-white text-xs font-medium tracking-wide text-gray-500 uppercase">
      <div className="min-w-0 flex-1 px-6 py-5">Descrição</div>
      <div className="w-28 shrink-0 px-6 py-5 text-center">Data</div>
      <div className="w-48 shrink-0 px-6 py-5 text-center">Categoria</div>
      <div className="w-32 shrink-0 px-6 py-5 text-center">Tipo</div>
      <div className="w-40 shrink-0 px-6 py-5 text-right">Valor</div>
      <div className="w-36 shrink-0 px-6 py-5 text-right">Ações</div>
    </div>
  )
}

type PageRowProps = {
  transaction: Transaction
  index: number
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}

function PageRow({ transaction, index, onEdit, onDelete }: PageRowProps) {
  const income = isIncome(transaction.type)
  const rowStyle = getRowStyle(transaction, index)

  return (
    <div className="flex h-[72px] items-center border-b border-gray-200 last:border-b-0">
      <div className="flex min-w-0 flex-1 items-center gap-4 px-6">
        <div
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-lg',
            rowStyle.icon,
          )}
        >
          <Receipt className="size-4" />
        </div>
        <p className="truncate text-base font-medium text-gray-800">{transaction.title}</p>
      </div>

      <div className="w-28 shrink-0 px-6 text-center text-sm text-gray-600">
        {formatDate(transaction.date)}
      </div>

      <div className="flex w-48 shrink-0 justify-center px-6">
        <span
          className={cn(
            'rounded-full px-3 py-1 text-sm font-medium',
            rowStyle.bg,
            rowStyle.text,
          )}
        >
          {getTagLabel(transaction)}
        </span>
      </div>

      <div className="flex w-32 shrink-0 items-center justify-center gap-2 px-6">
        {income ? (
          <CircleArrowUp className="size-4 text-green-base" />
        ) : (
          <CircleArrowDown className="size-4 text-red-base" />
        )}
        <span
          className={cn(
            'text-sm font-medium',
            income ? 'text-green-dark' : 'text-red-dark',
          )}
        >
          {getTypeLabel(transaction.type)}
        </span>
      </div>

      <div className="w-40 shrink-0 px-6 text-right text-sm font-semibold text-gray-800">
        {formatAmount(transaction)}
      </div>

      <div className="flex w-36 shrink-0 items-center justify-end gap-2 px-6">
        {onEdit && (
          <button
            type="button"
            onClick={() => onEdit(transaction.id)}
            className="text-sm font-medium text-brand-base"
          >
            Editar
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(transaction.id)}
            className="text-sm font-medium text-brand-base"
          >
            Excluir
          </button>
        )}
      </div>
    </div>
  )
}

function CompactRow({
  transaction,
  index,
  onEdit,
  onDelete,
  showType = false,
}: {
  transaction: Transaction
  index: number
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  showType?: boolean
}) {
  const income = isIncome(transaction.type)
  const rowStyle = getRowStyle(transaction, index)
  const hasActions = Boolean(onEdit || onDelete)

  return (
    <div className="flex gap-3 px-4 py-3.5 sm:px-6">
      <div
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-lg',
          rowStyle.icon,
        )}
      >
        <Receipt className="size-4" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-center justify-between gap-3">
          <p className="min-w-0 truncate text-base font-medium text-gray-800">
            {transaction.title}
          </p>
          <div className="flex shrink-0 items-center gap-1.5">
            {income ? (
              <CircleArrowUp className="size-4 text-green-base" />
            ) : (
              <CircleArrowDown className="size-4 text-red-base" />
            )}
            <span className="text-sm font-semibold text-gray-800 tabular-nums">
              {formatAmount(transaction)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <span className="shrink-0 text-sm text-gray-600">
              {formatDate(transaction.date)}
            </span>
            <span
              className={cn(
                'max-w-[140px] truncate rounded-full px-3 py-0.5 text-sm font-medium sm:max-w-none',
                rowStyle.bg,
                rowStyle.text,
              )}
            >
              {getTagLabel(transaction)}
            </span>
            {showType && (
              <span
                className={cn(
                  'shrink-0 text-sm font-medium',
                  income ? 'text-green-dark' : 'text-red-dark',
                )}
              >
                {getTypeLabel(transaction.type)}
              </span>
            )}
          </div>
          {hasActions && (
            <div className="flex shrink-0 items-center gap-3">
              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(transaction.id)}
                  className="text-sm font-medium text-brand-base"
                >
                  Editar
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(transaction.id)}
                  className="text-sm font-medium text-brand-base"
                >
                  Excluir
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function DashboardRow({
  transaction,
  index,
  onDelete,
}: {
  transaction: Transaction
  index: number
  onDelete?: (id: string) => void
}) {
  return (
    <CompactRow transaction={transaction} index={index} onDelete={onDelete} />
  )
}

export function TransactionList({
  transactions,
  variant = 'dashboard',
  onEdit,
  onDelete,
}: TransactionListProps) {
  const isLargeScreen = useIsLargeScreen()
  const sorted = sortTransactions(transactions)
  const items = variant === 'dashboard' ? sorted.slice(0, RECENT_LIMIT) : sorted

  if (items.length === 0) {
    return <EmptyState />
  }

  if (variant === 'page') {
    if (isLargeScreen) {
      return (
        <div>
          <PageTableHeader />
          <div className="divide-y divide-gray-200">
            {items.map((transaction, index) => (
              <PageRow
                key={transaction.id}
                transaction={transaction}
                index={index}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      )
    }

    return (
      <div className="divide-y divide-gray-200">
        {items.map((transaction, index) => (
          <CompactRow
            key={transaction.id}
            transaction={transaction}
            index={index}
            onEdit={onEdit}
            onDelete={onDelete}
            showType
          />
        ))}
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-200">
      {items.map((transaction, index) => (
        <DashboardRow
          key={transaction.id}
          transaction={transaction}
          index={index}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
