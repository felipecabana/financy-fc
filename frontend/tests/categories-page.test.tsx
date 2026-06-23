// @vitest-environment jsdom

import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { toast } from 'sonner'

import { useAuthStore } from '@/stores/auth'
import type { Category, Transaction } from '@/types'

import { mockUser, resetAuthStore } from './helpers/auth-test-utils'
import {
  mockCategoryA,
  mockTransactionUser1,
  renderCategories,
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

function createCategoriesPageFetch(
  initialCategories: Category[],
  initialTransactions: Transaction[],
) {
  let categories = [...initialCategories]
  let transactions = [...initialTransactions]
  const operations: string[] = []

  const fetchMock = vi.fn().mockImplementation(async (_uri: string, opts?: RequestInit) => {
    const body = JSON.parse(String(opts?.body))
    const operationName = body.operationName as string
    operations.push(operationName)

    if (operationName === 'ListCategories') {
      return jsonResponse({ data: { listCategories: categories } })
    }

    if (operationName === 'ListTransactions') {
      return jsonResponse({ data: { listTransactions: transactions } })
    }

    if (operationName === 'DeleteCategory') {
      categories = categories.filter((item) => item.id !== body.variables.id)
      return jsonResponse({ data: { deleteCategory: true } })
    }

    return jsonResponse({ data: {} })
  })

  return { fetchMock, operations }
}

function authenticate() {
  useAuthStore.setState({
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

describe('Categories page', () => {
  it('abre dialog de criacao ao clicar Nova categoria', async () => {
    const { fetchMock } = createCategoriesPageFetch([mockCategoryA], [mockTransactionUser1])
    authenticate()
    renderCategories(fetchMock)

    await waitFor(() => {
      expect(screen.getAllByText('Alimentação').length).toBeGreaterThan(0)
    })

    fireEvent.click(screen.getByRole('button', { name: 'Nova categoria' }))

    expect(screen.getByText('Nova categoria', { selector: 'h2' })).toBeTruthy()
  })

  it('abre dialog de edicao ao clicar Editar', async () => {
    const { fetchMock } = createCategoriesPageFetch([mockCategoryA], [mockTransactionUser1])
    authenticate()
    renderCategories(fetchMock)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Editar' })).toBeTruthy()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Editar' }))

    expect(screen.getByText('Editar categoria')).toBeTruthy()
    expect(screen.getByLabelText('Título')).toHaveProperty('value', 'Alimentação')
  })

  it('exclui categoria apos confirmacao e refaz ambas listagens', async () => {
    const { fetchMock, operations } = createCategoriesPageFetch(
      [mockCategoryA],
      [mockTransactionUser1],
    )
    authenticate()
    renderCategories(fetchMock)

    await waitFor(() => {
      expect(screen.getAllByText('Alimentação').length).toBeGreaterThan(0)
    })

    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }))

    const dialog = screen.getByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Excluir' }))

    await waitFor(() => {
      expect(operations).toContain('DeleteCategory')
      expect(screen.getByText('Nenhuma categoria cadastrada.')).toBeTruthy()
      expect(toast.success).toHaveBeenCalledWith('Categoria excluída com sucesso')
    })

    expect(operations.filter((op) => op === 'ListCategories').length).toBeGreaterThan(1)
    expect(operations.filter((op) => op === 'ListTransactions').length).toBeGreaterThan(1)
  })
})
