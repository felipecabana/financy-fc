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
  renderDashboard,
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

function createDashboardDeleteFetch(
  initialCategories: Category[],
  initialTransactions: Transaction[],
  options?: { failTransactionDelete?: boolean; failCategoryDelete?: boolean },
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

    if (operationName === 'DeleteTransaction') {
      if (options?.failTransactionDelete) {
        return jsonResponse({ errors: [{ message: 'Erro ao excluir transação' }] })
      }

      transactions = transactions.filter((item) => item.id !== body.variables.id)
      return jsonResponse({ data: { deleteTransaction: true } })
    }

    if (operationName === 'DeleteCategory') {
      if (options?.failCategoryDelete) {
        return jsonResponse({ errors: [{ message: 'Erro ao excluir categoria' }] })
      }

      categories = categories.filter((item) => item.id !== body.variables.id)
      return jsonResponse({ data: { deleteCategory: true } })
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

function openTransactionDeleteDialog() {
  fireEvent.click(screen.getAllByRole('button', { name: 'Excluir' })[0]!)
}

function openCategoryDeleteDialog() {
  fireEvent.click(screen.getAllByRole('button', { name: 'Excluir' })[1]!)
}

function confirmDeleteInDialog() {
  const dialog = screen.getByRole('dialog')
  fireEvent.click(within(dialog).getByRole('button', { name: 'Excluir' }))
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

describe('Dashboard delete flows', () => {
  it('abre dialog de confirmacao ao excluir transacao', async () => {
    const { fetchMock } = createDashboardDeleteFetch([mockCategoryA], [mockTransactionUser1])
    authenticate()
    renderDashboard(fetchMock)

    await waitFor(() => {
      expect(screen.getByText('Mercado User 1')).toBeTruthy()
    })

    openTransactionDeleteDialog()

    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(screen.getByText('Excluir transação')).toBeTruthy()
    expect(
      screen.getByText(
        'Tem certeza que deseja excluir "Mercado User 1"? Esta ação não pode ser desfeita.',
      ),
    ).toBeTruthy()
  })

  it('cancelar exclusao de transacao nao dispara mutation', async () => {
    const { fetchMock, operations } = createDashboardDeleteFetch(
      [mockCategoryA],
      [mockTransactionUser1],
    )
    authenticate()
    renderDashboard(fetchMock)

    await waitFor(() => {
      expect(screen.getByText('Mercado User 1')).toBeTruthy()
    })

    openTransactionDeleteDialog()
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull()
    })

    expect(operations).not.toContain('DeleteTransaction')
    expect(screen.getByText('Mercado User 1')).toBeTruthy()
  })

  it('exclui transacao com sucesso e refaz listagem', async () => {
    const { fetchMock, operations } = createDashboardDeleteFetch(
      [mockCategoryA],
      [mockTransactionUser1],
    )
    authenticate()
    renderDashboard(fetchMock)

    await waitFor(() => {
      expect(screen.getByText('Mercado User 1')).toBeTruthy()
    })

    openTransactionDeleteDialog()
    confirmDeleteInDialog()

    await waitFor(() => {
      expect(screen.queryByText('Mercado User 1')).toBeNull()
    })

    expect(operations).toContain('DeleteTransaction')
    expect(operations.filter((op) => op === 'ListTransactions').length).toBeGreaterThan(1)

    const deleteCall = fetchMock.mock.calls.find(([, opts]) => {
      const body = JSON.parse(String(opts?.body))
      return body.operationName === 'DeleteTransaction'
    })
    const deleteBody = JSON.parse(String(deleteCall?.[1]?.body))
    expect(deleteBody.variables).toEqual({ id: 'tx-user-1' })

    expect(toast.success).toHaveBeenCalledWith('Transação excluída com sucesso')
  })

  it('exibe toast de erro quando exclusao de transacao falha', async () => {
    const { fetchMock } = createDashboardDeleteFetch([mockCategoryA], [mockTransactionUser1], {
      failTransactionDelete: true,
    })
    authenticate()
    renderDashboard(fetchMock)

    await waitFor(() => {
      expect(screen.getByText('Mercado User 1')).toBeTruthy()
    })

    openTransactionDeleteDialog()
    confirmDeleteInDialog()

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Falha ao excluir a transação.')
    })

    expect(screen.getByText('Mercado User 1')).toBeTruthy()
  })

  it('cancelar exclusao de categoria nao dispara mutation', async () => {
    const { fetchMock, operations } = createDashboardDeleteFetch(
      [mockCategoryA],
      [mockTransactionUser1],
    )
    authenticate()
    renderDashboard(fetchMock)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Editar' })).toBeTruthy()
    })

    openCategoryDeleteDialog()
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull()
    })

    expect(operations).not.toContain('DeleteCategory')
    expect(screen.getByRole('button', { name: 'Editar' })).toBeTruthy()
  })

  it('exclui categoria com sucesso e refaz ambas listagens', async () => {
    const { fetchMock, operations } = createDashboardDeleteFetch(
      [mockCategoryA],
      [mockTransactionUser1],
    )
    authenticate()
    renderDashboard(fetchMock)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Editar' })).toBeTruthy()
    })

    openCategoryDeleteDialog()
    confirmDeleteInDialog()

    await waitFor(() => {
      expect(screen.getByText('Nenhuma categoria cadastrada.')).toBeTruthy()
    })

    expect(operations).toContain('DeleteCategory')
    expect(operations.filter((op) => op === 'ListCategories').length).toBeGreaterThan(1)
    expect(operations.filter((op) => op === 'ListTransactions').length).toBeGreaterThan(1)

    const deleteCall = fetchMock.mock.calls.find(([, opts]) => {
      const body = JSON.parse(String(opts?.body))
      return body.operationName === 'DeleteCategory'
    })
    const deleteBody = JSON.parse(String(deleteCall?.[1]?.body))
    expect(deleteBody.variables).toEqual({ id: 'cat-a' })

    expect(toast.success).toHaveBeenCalledWith('Categoria excluída com sucesso')
  })

  it('exibe toast de erro quando exclusao de categoria falha', async () => {
    const { fetchMock } = createDashboardDeleteFetch([mockCategoryA], [mockTransactionUser1], {
      failCategoryDelete: true,
    })
    authenticate()
    renderDashboard(fetchMock)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Editar' })).toBeTruthy()
    })

    openCategoryDeleteDialog()
    confirmDeleteInDialog()

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Falha ao excluir a categoria.')
    })

    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(screen.getByText('Excluir categoria')).toBeTruthy()
  })
})
