// @vitest-environment jsdom

import { ApolloProvider } from '@apollo/client/react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

import { App } from '@/App'
import { apolloClient } from '@/lib/graphql/apollo'
import { useAuthStore } from '@/stores/auth'

import {
  mockAppGraphQLFetch,
  mockUser,
  resetAuthStore,
  stubAppGraphQLFetch,
  waitForSessionBootstrap,
} from './helpers/auth-test-utils'

function renderProfileRoute(me = mockUser) {
  stubAppGraphQLFetch({ me })
  return render(
    <ApolloProvider client={apolloClient}>
      <MemoryRouter initialEntries={['/profile']}>
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

describe('Profile page', () => {
  it('exibe nome, e-mail e iniciais da sessao', async () => {
    renderProfileRoute()
    await waitForSessionBootstrap()

    expect(screen.getByRole('heading', { name: 'Maria Silva' })).toBeTruthy()
    expect(screen.getByLabelText('E-mail')).toHaveProperty('value', 'user1@financy.com')
    expect(screen.getByLabelText('Avatar').textContent).toBe('MS')
  })

  it('exibe botao Salvar alteracoes', async () => {
    renderProfileRoute()
    await waitForSessionBootstrap()

    expect(screen.getByRole('button', { name: 'Salvar alterações' })).toBeTruthy()
  })

  it('atualiza nome via updateUser e sessao', async () => {
    const fetchMock = mockAppGraphQLFetch({ me: mockUser })
    vi.stubGlobal('fetch', fetchMock)

    render(
      <ApolloProvider client={apolloClient}>
        <MemoryRouter initialEntries={['/profile']}>
          <App />
        </MemoryRouter>
      </ApolloProvider>,
    )
    await waitForSessionBootstrap()

    fireEvent.change(screen.getByLabelText('Nome completo'), {
      target: { value: 'Maria Atualizada' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }))

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Maria Atualizada' })).toBeTruthy()
      expect(useAuthStore.getState().user?.name).toBe('Maria Atualizada')
    })

    expect(fetchMock.mock.calls.some(([, init]) => String(init?.body).includes('updateUser'))).toBe(
      true,
    )
  })

  it('faz logout via mutation e redireciona para login', async () => {
    const fetchMock = mockAppGraphQLFetch({ me: mockUser })
    vi.stubGlobal('fetch', fetchMock)

    render(
      <ApolloProvider client={apolloClient}>
        <MemoryRouter initialEntries={['/profile']}>
          <App />
        </MemoryRouter>
      </ApolloProvider>,
    )
    await waitForSessionBootstrap()

    fireEvent.click(screen.getByRole('button', { name: 'Sair da conta' }))

    await waitFor(() => {
      expect(useAuthStore.getState().isAuthenticated).toBe(false)
      expect(useAuthStore.getState().user).toBeNull()
      expect(screen.getByRole('heading', { name: 'Fazer login' })).toBeTruthy()
    })

    expect(fetchMock.mock.calls.some(([, init]) => String(init?.body).includes('logout'))).toBe(
      true,
    )
  })
})
