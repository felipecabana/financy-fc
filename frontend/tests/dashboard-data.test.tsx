// @vitest-environment jsdom

import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen } from '@testing-library/react'

import { useDashboardData } from '@/pages/Dashboard/useDashboardData'
import { useAuthStore } from '@/stores/auth'

import { mockUser, resetAuthStore } from './helpers/auth-test-utils'
import {
  createDashboardWrapper,
  mockCategoryA,
  mockCategoryB,
  mockDashboardFetch,
  mockTransactionUser1,
  mockTransactionUser2,
  renderDashboard,
} from './helpers/dashboard-test-utils'

afterEach(async () => {
  cleanup()
  vi.restoreAllMocks()
  await resetAuthStore()
})

describe('useDashboardData', () => {
  it('nao dispara list queries quando deslogado', () => {
    const fetchMock = mockDashboardFetch([], [])

    renderHook(() => useDashboardData(), {
      wrapper: createDashboardWrapper(fetchMock),
    })

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('carrega categorias e transacoes do usuario autenticado', async () => {
    const fetchMock = mockDashboardFetch([mockCategoryA], [mockTransactionUser1])

    useAuthStore.setState({
      user: mockUser,
      isAuthenticated: true,
    })

    const { result } = renderHook(() => useDashboardData(), {
      wrapper: createDashboardWrapper(fetchMock),
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(fetchMock).toHaveBeenCalled()
    expect(result.current.categories).toEqual([mockCategoryA])
    expect(result.current.transactions).toHaveLength(1)
    expect(result.current.transactions[0]?.title).toBe(mockTransactionUser1.title)
    expect(result.current.transactions[0]?.category?.name).toBe('Alimentação')
  })

  it('expoe refetch para categorias e transacoes', async () => {
    const fetchMock = mockDashboardFetch([mockCategoryA], [mockTransactionUser1])

    useAuthStore.setState({
      user: mockUser,
      isAuthenticated: true,
    })

    const { result } = renderHook(() => useDashboardData(), {
      wrapper: createDashboardWrapper(fetchMock),
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(typeof result.current.refetchCategories).toBe('function')
    expect(typeof result.current.refetchTransactions).toBe('function')
  })
})

describe('Dashboard data view', () => {
  it('renderiza apenas os dados mockados do usuario atual', async () => {
    const fetchMock = mockDashboardFetch([mockCategoryA], [mockTransactionUser1])

    useAuthStore.setState({
      user: mockUser,
      isAuthenticated: true,
    })

    renderDashboard(fetchMock)

    await waitFor(() => {
      expect(screen.getByText('Mercado User 1')).toBeTruthy()
    })

    expect(screen.queryByText('Uber User 2')).toBeNull()
  })

  it('nao exibe transacao de outro usuario quando o mock retorna dados diferentes', async () => {
    const fetchMock = mockDashboardFetch([mockCategoryB], [mockTransactionUser2])

    useAuthStore.setState({
      user: mockUser,
      isAuthenticated: true,
    })

    renderDashboard(fetchMock)

    await waitFor(() => {
      expect(screen.getByText('Uber User 2')).toBeTruthy()
    })

    expect(screen.queryByText('Mercado User 1')).toBeNull()
  })

  it('exibe empty states quando nao ha categorias nem transacoes', async () => {
    const fetchMock = mockDashboardFetch([], [])

    useAuthStore.setState({
      user: mockUser,
      isAuthenticated: true,
    })

    renderDashboard(fetchMock)

    await waitFor(() => {
      expect(screen.getByText('Nenhuma categoria cadastrada.')).toBeTruthy()
    })

    expect(screen.getByText('Nenhuma transação cadastrada.')).toBeTruthy()
  })
})
