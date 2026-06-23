import type { ReactElement, ReactNode } from 'react'
import { ApolloProvider } from '@apollo/client/react'
import { render } from '@testing-library/react'
import { vi } from 'vitest'

import { Dashboard } from '@/pages/Dashboard'
import type { Category, Transaction } from '@/types'

import { createMockApolloClient } from './auth-test-utils'

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export const mockCategoryA: Category = {
  id: 'cat-a',
  name: 'Alimentação',
  userId: 'user-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

export const mockCategoryB: Category = {
  id: 'cat-b',
  name: 'Transporte',
  userId: 'user-2',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

export const mockTransactionUser1: Transaction = {
  id: 'tx-user-1',
  title: 'Mercado User 1',
  amount: 120.5,
  type: 'despesa',
  userId: 'user-1',
  categoryId: 'cat-a',
  category: { id: 'cat-a', name: 'Alimentação', userId: 'user-1', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  createdAt: '2026-06-15T00:00:00.000Z',
  updatedAt: '2026-06-15T00:00:00.000Z',
}

export const mockTransactionUser2: Transaction = {
  id: 'tx-user-2',
  title: 'Uber User 2',
  amount: 45,
  type: 'despesa',
  userId: 'user-2',
  categoryId: 'cat-b',
  category: { id: 'cat-b', name: 'Transporte', userId: 'user-2', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  createdAt: '2026-06-10T00:00:00.000Z',
  updatedAt: '2026-06-10T00:00:00.000Z',
}

export function mockDashboardFetch(categories: Category[], transactions: Transaction[]) {
  return vi.fn().mockImplementation(async (_uri: string, options?: RequestInit) => {
    const body = JSON.parse(String(options?.body))
    const operationName = body.operationName as string

    if (operationName === 'ListCategories') {
      return jsonResponse({ data: { listCategories: categories } })
    }

    if (operationName === 'ListTransactions') {
      return jsonResponse({ data: { listTransactions: transactions } })
    }

    return jsonResponse({ data: {} })
  })
}

export function renderWithDashboardApollo(ui: ReactElement, fetchImpl: typeof fetch) {
  const client = createMockApolloClient(fetchImpl)

  return render(<ApolloProvider client={client}>{ui}</ApolloProvider>)
}

export function renderDashboard(fetchImpl: typeof fetch) {
  return renderWithDashboardApollo(<Dashboard />, fetchImpl)
}

export function createDashboardWrapper(fetchImpl: typeof fetch) {
  const client = createMockApolloClient(fetchImpl)

  return function DashboardWrapper({ children }: { children: ReactNode }) {
    return <ApolloProvider client={client}>{children}</ApolloProvider>
  }
}
