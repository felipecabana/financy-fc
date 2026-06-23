import type { ReactElement } from 'react'
import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client'
import { ApolloProvider } from '@apollo/client/react'
import { render, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { expect, vi } from 'vitest'

import { Login } from '@/pages/Auth/Login'
import { Profile } from '@/pages/Profile'
import { Signup } from '@/pages/Auth/Signup'
import type { User } from '@/types'

export const mockUser: User = {
  id: 'user-1',
  name: 'Maria Silva',
  email: 'user1@financy.com',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

export async function resetAuthStore() {
  const { useAuthStore } = await import('@/stores/auth')
  useAuthStore.getState().logout()
  localStorage.clear()
  useAuthStore.setState({ user: null, isAuthenticated: false })
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

type AppGraphQLMockOptions = {
  me?: User | null
}

export function mockAppGraphQLFetch(options: AppGraphQLMockOptions = {}) {
  const { me = null } = options

  return vi.fn().mockImplementation(async (_url, init) => {
    const body = JSON.parse(String(init?.body ?? '{}'))
    const query = body.query as string

    if (query.includes('me')) {
      if (me) {
        return jsonResponse({ data: { me } })
      }
      return jsonResponse({ errors: [{ message: 'Não autenticado.' }] })
    }

    if (query.includes('logout')) {
      return jsonResponse({ data: { logout: true } })
    }

    if (query.includes('listCategories')) {
      return jsonResponse({ data: { listCategories: [] } })
    }

    if (query.includes('listTransactions')) {
      return jsonResponse({ data: { listTransactions: [] } })
    }

    return jsonResponse({ data: {} })
  })
}

export function stubAppGraphQLFetch(options: AppGraphQLMockOptions = {}) {
  vi.stubGlobal('fetch', mockAppGraphQLFetch(options))
}

export async function waitForSessionBootstrap() {
  await waitFor(() => {
    expect(document.querySelector('[role="status"][aria-label="Carregando sessão"]')).toBeNull()
  })
}

export function createMockApolloClient(fetchImpl: typeof fetch) {
  return new ApolloClient({
    link: new HttpLink({
      uri: 'http://localhost:4000/graphql',
      fetch: fetchImpl,
      credentials: 'include',
    }),
    cache: new InMemoryCache(),
  })
}

export function mockAuthFetchSuccess(mutation: 'login' | 'signup', user = mockUser) {
  return vi.fn().mockResolvedValue(
    jsonResponse({
      data: {
        [mutation]: { user },
      },
    }),
  )
}

export function mockAuthFetchGraphQLError(message: string) {
  return vi.fn().mockResolvedValue(
    jsonResponse({
      errors: [{ message }],
    }),
  )
}

export function mockAuthFetchNetworkError() {
  return vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))
}

function renderWithProviders(ui: ReactElement, fetchImpl: typeof fetch) {
  return render(
    <ApolloProvider client={createMockApolloClient(fetchImpl)}>
      <MemoryRouter>{ui}</MemoryRouter>
    </ApolloProvider>,
  )
}

export function renderLogin(fetchImpl: typeof fetch) {
  return renderWithProviders(<Login />, fetchImpl)
}

export function renderSignup(fetchImpl: typeof fetch) {
  return renderWithProviders(<Signup />, fetchImpl)
}

export function renderProfile(fetchImpl: typeof fetch) {
  return renderWithProviders(<Profile />, fetchImpl)
}

export function renderLoginWithNetworkError() {
  return renderWithProviders(<Login />, mockAuthFetchNetworkError())
}

export function renderSignupWithNetworkError() {
  return renderWithProviders(<Signup />, mockAuthFetchNetworkError())
}
