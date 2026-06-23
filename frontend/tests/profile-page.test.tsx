// @vitest-environment jsdom

import { ApolloProvider } from '@apollo/client/react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

import { App } from '@/App'
import { apolloClient } from '@/lib/graphql/apollo'
import { useAuthStore } from '@/stores/auth'

import { mockUser, resetAuthStore } from './helpers/auth-test-utils'

function renderProfileRoute() {
  return render(
    <ApolloProvider client={apolloClient}>
      <MemoryRouter initialEntries={['/profile']}>
        <App />
      </MemoryRouter>
    </ApolloProvider>,
  )
}

function authenticate() {
  useAuthStore.setState({
    token: 'jwt-test-token',
    user: mockUser,
    isAuthenticated: true,
  })
}

afterEach(async () => {
  cleanup()
  await resetAuthStore()
})

describe('Profile page', () => {
  it('exibe nome, e-mail e iniciais da sessao', () => {
    authenticate()
    renderProfileRoute()

    expect(screen.getByRole('heading', { name: 'Maria Silva' })).toBeTruthy()
    expect(screen.getByLabelText('E-mail')).toHaveProperty('value', 'user1@financy.com')
    expect(screen.getByLabelText('Avatar').textContent).toBe('MS')
  })

  it('faz logout e redireciona para login', () => {
    authenticate()
    renderProfileRoute()

    fireEvent.click(screen.getByRole('button', { name: 'Sair da conta' }))

    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(useAuthStore.getState().token).toBeNull()
    expect(screen.getByRole('heading', { name: 'Fazer login' })).toBeTruthy()
  })
})
