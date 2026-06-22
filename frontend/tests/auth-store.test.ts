import { afterEach, describe, expect, it } from 'vitest'

import { useAuthStore } from '@/stores/auth'
import { mockUser, resetAuthStore } from './helpers/auth-test-utils'

afterEach(async () => {
  await resetAuthStore()
})

describe('useAuthStore', () => {
  it('inicia sem sessao ativa', () => {
    expect(useAuthStore.getState().token).toBeNull()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  it('expoe token apos setState para uso do authLink', () => {
    useAuthStore.setState({
      token: 'jwt-test-token',
      user: mockUser,
      isAuthenticated: true,
    })

    expect(useAuthStore.getState().token).toBe('jwt-test-token')
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
  })

  it('logout limpa token e isAuthenticated', () => {
    useAuthStore.setState({
      token: 'jwt-test-token',
      user: mockUser,
      isAuthenticated: true,
    })

    useAuthStore.getState().logout()

    expect(useAuthStore.getState().token).toBeNull()
    expect(useAuthStore.getState().user).toBeNull()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  it('reidrata sessao do localStorage apos reload simulado', async () => {
    useAuthStore.setState({
      token: 'jwt-persisted',
      user: mockUser,
      isAuthenticated: true,
    })

    await new Promise((resolve) => setTimeout(resolve, 0))
    const persistedSession = localStorage.getItem('financy-auth-storage')
    expect(persistedSession).toContain('jwt-persisted')

    useAuthStore.setState({ user: null, token: null, isAuthenticated: false })
    localStorage.setItem('financy-auth-storage', persistedSession!)

    await useAuthStore.persist.rehydrate()

    expect(useAuthStore.getState().token).toBe('jwt-persisted')
    expect(useAuthStore.getState().user).toEqual(mockUser)
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
  })
})
