import type { Transaction } from '@/types'

export type TransactionSummary = {
  balance: number
  monthlyIncome: number
  monthlyExpenses: number
}

function isIncome(type: string) {
  return type.toLowerCase() === 'receita'
}

function getCalendarMonth(dateIso: string) {
  const [year, month] = dateIso.slice(0, 10).split('-').map(Number)
  return { year, month }
}

function isSameMonth(dateIso: string, reference: Date) {
  const { year, month } = getCalendarMonth(dateIso)
  return year === reference.getFullYear() && month === reference.getMonth() + 1
}

export function computeTransactionSummary(
  transactions: Transaction[],
  referenceDate = new Date(),
): TransactionSummary {
  let balance = 0
  let monthlyIncome = 0
  let monthlyExpenses = 0

  for (const transaction of transactions) {
    const amount = Math.abs(transaction.amount)
    const income = isIncome(transaction.type)

    balance += income ? amount : -amount

    if (isSameMonth(transaction.date, referenceDate)) {
      if (income) {
        monthlyIncome += amount
      } else {
        monthlyExpenses += amount
      }
    }
  }

  return { balance, monthlyIncome, monthlyExpenses }
}
