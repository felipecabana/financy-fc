// @vitest-environment jsdom

import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { toast } from 'sonner'

import { useAuthStore } from '@/stores/auth'
import type { Transaction } from '@/types'

import { mockUser, resetAuthStore } from './helpers/auth-test-utils'
import {
  mockCategoryA,
  mockTransactionUser1,
  renderTransactions,
} from './helpers/dashboard-test-utils'

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function createTransactionsPageFetch(
  initialTransactions: Transaction[],
  options?: { failDelete?: boolean },
) {
  let transactions = [...initialTransactions]
  const operations: string[] = []

  const fetchMock = vi.fn().mockImplementation(async (_uri: string, opts?: RequestInit) => {
    const body = JSON.parse(String(opts?.body))
    const operationName = body.operationName as string
    operations.push(operationName)

    if (operationName === 'ListCategories') {
      return jsonResponse({ data: { listCategories: [mockCategoryA] } })
    }

    if (operationName === 'ListTransactions') {
      return jsonResponse({ data: { listTransactions: transactions } })
    }

    if (operationName === 'DeleteTransaction') {
      if (options?.failDelete) {
        return jsonResponse({ errors: [{ message: 'Erro ao excluir transação' }] })
      }

      transactions = transactions.filter((item) => item.id !== body.variables.id)
      return jsonResponse({ data: { deleteTransaction: true } })
    }

    return jsonResponse({ data: {} })
  })

  return { fetchMock, operations }
}

function authenticate() {
  useAuthStore.setState({
    token: 'jwt-test-token',
    user: mockUser,
    isAuthenticated: true,
  })
}

beforeEach(() => {
  vi.mocked(toast.success).mockClear()
  vi.mocked(toast.error).mockClear()
})

afterEach(async () => {
  cleanup()
  vi.restoreAllMocks()
  await resetAuthStore()
})

describe('Transactions page', () => {
  it('abre dialog de criacao ao clicar Nova transacao', async () => {
    const { fetchMock } = createTransactionsPageFetch([mockTransactionUser1])
    authenticate()
    renderTransactions(fetchMock)

    await waitFor(() => {
      expect(screen.getByText('Mercado User 1')).toBeTruthy()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Nova transação' }))

    expect(screen.getByText('Nova transação', { selector: 'h2' })).toBeTruthy()
  })

  it('abre dialog de edicao ao clicar Editar', async () => {
    const { fetchMock } = createTransactionsPageFetch([mockTransactionUser1])
    authenticate()
    renderTransactions(fetchMock)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Editar' })).toBeTruthy()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Editar' }))

    expect(screen.getByText('Editar transação')).toBeTruthy()
    expect(screen.getByLabelText('Descrição')).toHaveProperty('value', 'Mercado User 1')
  })

  it('exclui transacao apos confirmacao', async () => {
    const { fetchMock, operations } = createTransactionsPageFetch([mockTransactionUser1])
    authenticate()
    renderTransactions(fetchMock)

    await waitFor(() => {
      expect(screen.getByText('Mercado User 1')).toBeTruthy()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }))

    const dialog = screen.getByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Excluir' }))

    await waitFor(() => {
      expect(operations).toContain('DeleteTransaction')
      expect(screen.queryByText('Mercado User 1')).toBeNull()
      expect(toast.success).toHaveBeenCalledWith('Transação excluída com sucesso')
    })
  })
})
