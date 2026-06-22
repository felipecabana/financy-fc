import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import { Layout } from '@/components/Layout'
import { RootPage } from '@/pages/Root'
import { useAuthStore } from '@/stores/auth'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  return isAuthenticated ? <>{children}</> : <Navigate to="/" replace />
}

export function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<RootPage />} />
      </Routes>
    </Layout>
  )
}
