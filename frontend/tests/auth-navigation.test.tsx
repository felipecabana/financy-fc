// @vitest-environment jsdom

import { ApolloProvider } from '@apollo/client/react'
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { App, GuestRoute, ProtectedRoute } from '@/App'
import { apolloClient } from '@/lib/graphql/apollo'
import { RootPage } from '@/pages/Root'
import { useAuthStore } from '@/stores/auth'
import { mockUser, resetAuthStore } from './helpers/auth-test-utils'

function renderApp(initialRoute = '/') {
  return render(
    <ApolloProvider client={apolloClient}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <App />
      </MemoryRouter>
    </ApolloProvider>,
  )
}

function renderRootPage() {
  return render(
    <ApolloProvider client={apolloClient}>
      <MemoryRouter>
        <RootPage />
      </MemoryRouter>
    </ApolloProvider>,
  )
}

afterEach(async () => {
  cleanup()
  await resetAuthStore()
})

describe('auth navigation', () => {
  it('RootPage exibe Login sem sessao', () => {
    renderRootPage()

    expect(screen.getByRole('heading', { name: 'Fazer login' })).toBeTruthy()
  })

  it('RootPage exibe Dashboard com sessao', () => {
    useAuthStore.setState({
      token: 'jwt-test-token',
      user: mockUser,
      isAuthenticated: true,
    })

    renderRootPage()

    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeTruthy()
  })

  it('exibe Signup em /signup', () => {
    renderApp('/signup')

    expect(screen.getByRole('heading', { name: 'Criar conta' })).toBeTruthy()
  })

  it('navega de login para signup pelo link Criar conta', () => {
    renderApp('/')

    fireEvent.click(screen.getByRole('link', { name: 'Criar conta' }))

    expect(screen.getByRole('heading', { name: 'Criar conta' })).toBeTruthy()
  })

  it('navega de signup para login pelo link Fazer login', () => {
    renderApp('/signup')

    fireEvent.click(screen.getByRole('link', { name: 'Fazer login' }))

    expect(screen.getByRole('heading', { name: 'Fazer login' })).toBeTruthy()
  })

  it('redireciona /signup para Dashboard quando autenticado', () => {
    useAuthStore.setState({
      token: 'jwt-test-token',
      user: mockUser,
      isAuthenticated: true,
    })

    renderApp('/signup')

    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeTruthy()
    expect(screen.queryByRole('heading', { name: 'Criar conta' })).toBeNull()
  })

  it('ProtectedRoute redireciona para / sem sessao', () => {
    render(
      <MemoryRouter initialEntries={['/transactions']}>
        <Routes>
          <Route path="/" element={<h1>Entrar</h1>} />
          <Route
            path="/transactions"
            element={
              <ProtectedRoute>
                <h1>Transacoes</h1>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Entrar' })).toBeTruthy()
    expect(screen.queryByRole('heading', { name: 'Transacoes' })).toBeNull()
  })

  it('GuestRoute redireciona para / com sessao', () => {
    useAuthStore.setState({
      token: 'jwt-test-token',
      user: mockUser,
      isAuthenticated: true,
    })

    render(
      <MemoryRouter initialEntries={['/signup']}>
        <Routes>
          <Route path="/" element={<h1>Dashboard</h1>} />
          <Route
            path="/signup"
            element={
              <GuestRoute>
                <h1>Cadastro</h1>
              </GuestRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeTruthy()
  })
})
