import { useAuthStore } from '@/stores/auth'
import { Dashboard } from '@/pages/Dashboard'
import { Login } from '@/pages/Auth/Login'

export function RootPage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  return isAuthenticated ? <Dashboard /> : <Login />
}
