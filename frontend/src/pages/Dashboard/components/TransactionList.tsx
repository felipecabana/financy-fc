import { CircleArrowDown, CircleArrowUp, Receipt } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { Transaction } from '@/types'

type TransactionListProps = {
  transactions: Transaction[]
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

function getRowStyle(transaction: Transaction, index: number) {
  if (isIncome(transaction.type) && !transaction.category?.name) {
    return incomeTag
  }

  return tagVariants[index % tagVariants.length]!
}

export function TransactionList({ transactions, onDelete }: TransactionListProps) {
  const recent = [...transactions]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, RECENT_LIMIT)

  if (recent.length === 0) {
    return (
      <p className="px-6 py-8 text-center text-sm text-gray-500">
        Nenhuma transação cadastrada.
      </p>
    )
  }

  return (
    <div className="divide-y divide-gray-200">
      {recent.map((transaction, index) => {
        const income = isIncome(transaction.type)
        const rowStyle = getRowStyle(transaction, index)

        return (
          <div key={transaction.id} className="flex h-20 items-center">
            <div className="flex min-w-0 flex-1 items-center gap-4 px-6">
              <div
                className={cn(
                  'flex size-10 shrink-0 items-center justify-center rounded-lg',
                  rowStyle.icon,
                )}
              >
                <Receipt className="size-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-base font-medium text-gray-800">{transaction.title}</p>
                <p className="text-sm text-gray-600">{formatDate(transaction.createdAt)}</p>
              </div>
            </div>

            <div className="flex w-40 shrink-0 items-center justify-center px-6">
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

            <div className="flex w-40 shrink-0 items-center justify-end gap-2 px-6">
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(transaction.id)}
                  className="shrink-0 text-sm font-medium text-brand-base"
                >
                  Excluir
                </button>
              )}
              <span className="text-sm font-semibold text-gray-800">{formatAmount(transaction)}</span>
              {income ? (
                <CircleArrowUp className="size-4 text-green-base" />
              ) : (
                <CircleArrowDown className="size-4 text-red-base" />
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
