import { describe, expect, it } from 'vitest'

import {
  createDefaultTransactionFilters,
  filterTransactions,
  formatPeriodLabel,
  getTransactionPeriods,
} from '@/pages/Transactions/filterTransactions'
import type { Transaction } from '@/types'

function createTransaction(overrides: Partial<Transaction>): Transaction {
  return {
    id: 'tx-1',
    title: 'Test',
    amount: 100,
    type: 'despesa',
    date: '2026-06-15T00:00:00.000Z',
    userId: 'user-1',
    createdAt: '2026-06-15T00:00:00.000Z',
    updatedAt: '2026-06-15T00:00:00.000Z',
    ...overrides,
  }
}

describe('filterTransactions', () => {
  const transactions = [
    createTransaction({
      id: '1',
      title: 'Mercado',
      type: 'despesa',
      amount: 120,
      date: '2026-06-10T00:00:00.000Z',
      categoryId: 'cat-a',
    }),
    createTransaction({
      id: '2',
      title: 'Salário',
      type: 'receita',
      amount: 5000,
      date: '2026-06-01T00:00:00.000Z',
      categoryId: 'cat-b',
    }),
    createTransaction({
      id: '3',
      title: 'Uber',
      type: 'despesa',
      amount: 45,
      date: '2026-05-20T00:00:00.000Z',
      categoryId: 'cat-a',
    }),
  ]

  it('filtra por busca, tipo, categoria e periodo', () => {
    const filters = {
      ...createDefaultTransactionFilters(),
      search: 'merc',
      type: 'despesa' as const,
      categoryId: 'cat-a',
      period: '2026-06',
    }

    expect(filterTransactions(transactions, filters)).toEqual([transactions[0]])
  })

  it('retorna todas quando filtros estao em todos', () => {
    const filters = {
      ...createDefaultTransactionFilters(),
      type: 'all' as const,
      categoryId: 'all',
      period: 'all',
    }

    expect(filterTransactions(transactions, filters)).toHaveLength(3)
  })

  it('formata periodo e lista meses disponiveis', () => {
    expect(formatPeriodLabel('2026-06')).toBe('Junho / 2026')
    expect(getTransactionPeriods(transactions)).toEqual(['2026-06', '2026-05'])
  })
})
