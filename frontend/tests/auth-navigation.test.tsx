// @vitest-environment jsdom

import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { ProtectedRoute } from '@/App'
import { RootPage } from '@/pages/Root'
import { useAuthStore } from '@/stores/auth'
import { mockUser, resetAuthStore } from './helpers/auth-test-utils'

afterEach(async () => {
  cleanup()
  await resetAuthStore()
})

describe('auth navigation', () => {
  it('RootPage exibe Entrar sem sessao', () => {
    render(<RootPage />)

    expect(screen.getByRole('heading', { name: 'Entrar' })).toBeTruthy()
  })

  it('RootPage exibe Dashboard com sessao', () => {
    useAuthStore.setState({
      token: 'jwt-test-token',
      user: mockUser,
      isAuthenticated: true,
    })

    render(<RootPage />)

    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeTruthy()
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
})
