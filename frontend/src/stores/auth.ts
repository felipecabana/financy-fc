import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { apolloClient } from '@/lib/graphql/apollo'
import type { User } from '@/types'

type AuthState = {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false })
        void apolloClient.clearStore()
      },
    }),
    {
      name: 'financy-auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        token: state.token,
        user: state.user,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isAuthenticated = Boolean(state.token)
        }
      },
    },
  ),
)
