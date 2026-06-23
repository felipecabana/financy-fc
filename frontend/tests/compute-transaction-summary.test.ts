import { describe, expect, it } from 'vitest'

import { computeTransactionSummary } from '@/pages/Dashboard/computeTransactionSummary'
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

describe('computeTransactionSummary', () => {
  const referenceDate = new Date('2026-06-20T12:00:00.000Z')

  it('calcula saldo total, receitas e despesas do mes', () => {
    const transactions = [
      createTransaction({ id: '1', amount: 5000, type: 'receita', date: '2026-06-01T00:00:00.000Z' }),
      createTransaction({ id: '2', amount: 120.5, type: 'despesa', date: '2026-06-15T00:00:00.000Z' }),
      createTransaction({ id: '3', amount: 80, type: 'despesa', date: '2026-05-10T00:00:00.000Z' }),
    ]

    const summary = computeTransactionSummary(transactions, referenceDate)

    expect(summary.balance).toBe(4799.5)
    expect(summary.monthlyIncome).toBe(5000)
    expect(summary.monthlyExpenses).toBe(120.5)
  })

  it('retorna zeros quando nao ha transacoes', () => {
    const summary = computeTransactionSummary([], referenceDate)

    expect(summary).toEqual({
      balance: 0,
      monthlyIncome: 0,
      monthlyExpenses: 0,
    })
  })
})
