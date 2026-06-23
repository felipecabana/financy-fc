import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { apolloClient } from '@/lib/graphql/apollo'
import type { User } from '@/types'

type AuthState = {
  user: User | null
  isAuthenticated: boolean
  setSession: (user: User) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setSession: (user) => {
        set({ user, isAuthenticated: true })
      },
      logout: () => {
        set({ user: null, isAuthenticated: false })
        void apolloClient.clearStore()
      },
    }),
    {
      name: 'financy-auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isAuthenticated = Boolean(state.user)
        }
      },
    },
  ),
)
