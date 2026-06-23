import type { Category, Transaction } from '@/types'

export type TransactionFilters = {
  search: string
  type: 'all' | 'receita' | 'despesa'
  categoryId: string
  period: string
}

const MONTH_LABELS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
] as const

export function getCurrentPeriod() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${now.getFullYear()}-${month}`
}

export function createDefaultTransactionFilters(): TransactionFilters {
  return {
    search: '',
    type: 'all',
    categoryId: 'all',
    period: getCurrentPeriod(),
  }
}

export function formatPeriodLabel(period: string) {
  const [year, month] = period.split('-').map(Number)
  return `${MONTH_LABELS[month! - 1]} / ${year}`
}

export function getTransactionPeriods(transactions: Transaction[]) {
  const periods = new Set<string>()

  for (const transaction of transactions) {
    periods.add(transaction.date.slice(0, 7))
  }

  return [...periods].sort((a, b) => b.localeCompare(a))
}

function isIncome(type: string) {
  return type.toLowerCase() === 'receita'
}

export function filterTransactions(transactions: Transaction[], filters: TransactionFilters) {
  const search = filters.search.trim().toLowerCase()

  return transactions.filter((transaction) => {
    if (search && !transaction.title.toLowerCase().includes(search)) {
      return false
    }

    if (filters.type !== 'all') {
      const income = isIncome(transaction.type)
      if (filters.type === 'receita' && !income) return false
      if (filters.type === 'despesa' && income) return false
    }

    if (filters.categoryId !== 'all' && transaction.categoryId !== filters.categoryId) {
      return false
    }

    if (filters.period !== 'all' && transaction.date.slice(0, 7) !== filters.period) {
      return false
    }

    return true
  })
}

export function sortCategoriesForFilter(categories: Category[]) {
  return [...categories].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
}
