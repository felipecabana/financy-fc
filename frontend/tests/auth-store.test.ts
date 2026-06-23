import { afterEach, describe, expect, it } from 'vitest'

import { useAuthStore } from '@/stores/auth'
import { mockUser, resetAuthStore } from './helpers/auth-test-utils'

afterEach(async () => {
  await resetAuthStore()
})

describe('useAuthStore', () => {
  it('inicia sem sessao ativa', () => {
    expect(useAuthStore.getState().user).toBeNull()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(useAuthStore.getState()).not.toHaveProperty('token')
  })

  it('setSession registra user e isAuthenticated', () => {
    useAuthStore.getState().setSession(mockUser)

    expect(useAuthStore.getState().user).toEqual(mockUser)
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
  })

  it('logout limpa sessao criada por setSession', () => {
    useAuthStore.getState().setSession(mockUser)
    useAuthStore.getState().logout()

    expect(useAuthStore.getState().user).toBeNull()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  it('reidrata user do localStorage apos reload simulado', async () => {
    useAuthStore.setState({
      user: mockUser,
      isAuthenticated: true,
    })

    await new Promise((resolve) => setTimeout(resolve, 0))
    const persistedSession = localStorage.getItem('financy-auth-storage')
    expect(persistedSession).toContain(mockUser.email)
    expect(persistedSession).not.toContain('token')

    useAuthStore.setState({ user: null, isAuthenticated: false })
    localStorage.setItem('financy-auth-storage', persistedSession!)

    await useAuthStore.persist.rehydrate()

    expect(useAuthStore.getState().user).toEqual(mockUser)
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
  })
})
