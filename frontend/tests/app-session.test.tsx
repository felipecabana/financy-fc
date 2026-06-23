// @vitest-environment jsdom

import { ApolloProvider } from '@apollo/client/react'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

import { App } from '@/App'
import { apolloClient } from '@/lib/graphql/apollo'
import { useAuthStore } from '@/stores/auth'

import {
  mockUser,
  resetAuthStore,
  stubAppGraphQLFetch,
  waitForSessionBootstrap,
} from './helpers/auth-test-utils'

function renderApp(me: typeof mockUser | null = null) {
  stubAppGraphQLFetch({ me })
  return render(
    <ApolloProvider client={apolloClient}>
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    </ApolloProvider>,
  )
}

afterEach(async () => {
  cleanup()
  vi.unstubAllGlobals()
  await resetAuthStore()
})

describe('session bootstrap', () => {
  it('restaura sessao via me quando cookie valido', async () => {
    renderApp(mockUser)
    await waitForSessionBootstrap()

    expect(useAuthStore.getState().isAuthenticated).toBe(true)
    expect(useAuthStore.getState().user).toEqual(mockUser)
    expect(screen.getByText('Transações recentes')).toBeTruthy()
  })

  it('mantem usuario deslogado quando me falha', async () => {
    renderApp(null)
    await waitForSessionBootstrap()

    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(useAuthStore.getState().user).toBeNull()
    expect(screen.getByRole('heading', { name: 'Fazer login' })).toBeTruthy()
  })
})
