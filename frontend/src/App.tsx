import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import { Layout } from '@/components/Layout'
import { apolloClient } from '@/lib/graphql/apollo'
import { ME_QUERY, type MeQueryData } from '@/lib/graphql/queries'
import { Signup } from '@/pages/Auth/Signup'
import { Categories } from '@/pages/Categories'
import { Profile } from '@/pages/Profile'
import { RootPage } from '@/pages/Root'
import { Transactions } from '@/pages/Transactions'
import { useAuthStore } from '@/stores/auth'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  return isAuthenticated ? <>{children}</> : <Navigate to="/" replace />
}

export function GuestRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  return isAuthenticated ? <Navigate to="/" replace /> : <>{children}</>
}

function SessionBootstrap({ children }: { children: ReactNode }) {
  const [sessionReady, setSessionReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      await useAuthStore.persist.rehydrate()

      try {
        const { data } = await apolloClient.query<MeQueryData>({
          query: ME_QUERY,
          fetchPolicy: 'network-only',
        })

        if (!cancelled && data?.me) {
          useAuthStore.getState().setSession(data.me)
        }
      } catch {
        if (!cancelled) {
          useAuthStore.getState().logout()
        }
      } finally {
        if (!cancelled) {
          setSessionReady(true)
        }
      }
    }

    void bootstrap()

    return () => {
      cancelled = true
    }
  }, [])

  if (!sessionReady) {
    return (
      <Layout>
        <div className="flex flex-1" role="status" aria-label="Carregando sessão" />
      </Layout>
    )
  }

  return children
}

export function App() {
  return (
    <SessionBootstrap>
      <Layout>
        <Routes>
          <Route path="/" element={<RootPage />} />
          <Route
            path="/signup"
            element={
              <GuestRoute>
                <Signup />
              </GuestRoute>
            }
          />
          <Route
            path="/transactions"
            element={
              <ProtectedRoute>
                <Transactions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/categories"
            element={
              <ProtectedRoute>
                <Categories />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Layout>
    </SessionBootstrap>
  )
}
