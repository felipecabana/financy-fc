// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react'

import { useAuthStore } from '@/stores/auth'
import {
  mockAuthFetchGraphQLError,
  mockAuthFetchSuccess,
  mockUser,
  renderLogin,
  renderLoginWithNetworkError,
  renderSignup,
  renderSignupWithNetworkError,
  resetAuthStore,
} from './helpers/auth-test-utils'

afterEach(async () => {
  cleanup()
  vi.restoreAllMocks()
  await resetAuthStore()
})

describe('login form', () => {
  it('exige e-mail no submit', () => {
    renderLogin(vi.fn())

    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(screen.getByRole('alert').textContent).toBe('Preencha o e-mail.')
  })

  it('valida formato de e-mail', () => {
    renderLogin(vi.fn())

    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'email-invalido' } })
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'senha123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(screen.getByRole('alert').textContent).toBe('Informe um e-mail válido.')
  })

  it('cria sessao apos login bem-sucedido', async () => {
    const fetchMock = mockAuthFetchSuccess('login')
    renderLogin(fetchMock)

    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: mockUser.email } })
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'senha123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    await waitFor(() => {
      expect(useAuthStore.getState().isAuthenticated).toBe(true)
      expect(useAuthStore.getState().user).toEqual(mockUser)
    })

    const [, init] = fetchMock.mock.calls[0] ?? []
    expect(init?.credentials).toBe('include')
    expect(init?.headers?.Authorization ?? init?.headers?.authorization).toBeUndefined()
  })

  it('exibe erro para credenciais invalidas', async () => {
    renderLogin(mockAuthFetchGraphQLError('Credenciais inválidas.'))

    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: mockUser.email } })
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'senha-errada' } })
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect((await screen.findByRole('alert')).textContent).toBe('Credenciais inválidas.')
  })

  it('exibe erro de conexao', async () => {
    renderLoginWithNetworkError()

    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: mockUser.email } })
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'senha123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect((await screen.findByRole('alert')).textContent).toBe('Falha de conexão. Tente novamente.')
  })
})

describe('signup form', () => {
  it('exige nome no submit', () => {
    renderSignup(vi.fn())

    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar' }))

    expect(screen.getByRole('alert').textContent).toBe('Preencha o nome completo.')
  })

  it('exige senha com no minimo 8 caracteres', () => {
    renderSignup(vi.fn())

    fireEvent.change(screen.getByLabelText('Nome completo'), { target: { value: 'Fulano' } })
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'novo@test.com' } })
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: '123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar' }))

    expect(screen.getByRole('alert').textContent).toBe('A senha deve ter no mínimo 8 caracteres.')
  })

  it('cria sessao apos cadastro bem-sucedido', async () => {
    const newUser = { ...mockUser, email: 'novo@test.com', name: 'Fulano Silva' }
    renderSignup(mockAuthFetchSuccess('signup', newUser))

    fireEvent.change(screen.getByLabelText('Nome completo'), { target: { value: 'Fulano Silva' } })
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: newUser.email } })
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'senha12345' } })
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar' }))

    await waitFor(() => {
      expect(useAuthStore.getState().isAuthenticated).toBe(true)
      expect(useAuthStore.getState().user).toEqual(newUser)
    })
  })

  it('exibe erro quando email ja esta cadastrado', async () => {
    renderSignup(mockAuthFetchGraphQLError('Email já cadastrado.'))

    fireEvent.change(screen.getByLabelText('Nome completo'), { target: { value: 'Fulano Silva' } })
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: mockUser.email } })
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'senha12345' } })
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar' }))

    expect((await screen.findByRole('alert')).textContent).toBe('Email já cadastrado.')
  })

  it('exibe erro de conexao', async () => {
    renderSignupWithNetworkError()

    fireEvent.change(screen.getByLabelText('Nome completo'), { target: { value: 'Fulano Silva' } })
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'novo@test.com' } })
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'senha12345' } })
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar' }))

    expect((await screen.findByRole('alert')).textContent).toBe('Falha de conexão. Tente novamente.')
  })
})
