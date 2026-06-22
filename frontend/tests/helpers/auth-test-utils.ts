import type { User } from '@/types'

export const mockUser: User = {
  id: 'user-1',
  email: 'user1@financy.com',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

export async function resetAuthStore() {
  const { useAuthStore } = await import('@/stores/auth')
  useAuthStore.getState().logout()
  localStorage.clear()
  useAuthStore.setState({ user: null, token: null, isAuthenticated: false })
}
