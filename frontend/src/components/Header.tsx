import { Link, NavLink } from 'react-router-dom'

import { Logo } from '@/components/Logo'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth'
import type { User } from '@/types'

const navLinks = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/transactions', label: 'Transações' },
  { to: '/categories', label: 'Categorias' },
] as const

const headerPadding = 'px-4 sm:px-8 lg:px-12'

function getUserInitials(user: User) {
  const name = (user.name ?? '').trim()
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean)
    if (parts.length >= 2) {
      const first = parts[0]?.[0] ?? ''
      const last = parts[parts.length - 1]?.[0] ?? ''
      return `${first}${last}`.toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }

  return user.email.slice(0, 2).toUpperCase()
}

export function Header() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const user = useAuthStore((state) => state.user)

  if (!isAuthenticated) {
    return (
      <header className="border-b border-gray-200 bg-white">
        <div className={cn('mx-auto flex h-[69px] max-w-7xl items-center', headerPadding)}>
          <Logo />
        </div>
      </header>
    )
  }

  const initials = user ? getUserInitials(user) : '?'

  return (
    <header className="border-b border-gray-200 bg-white">
      <div
        className={cn(
          'mx-auto flex h-[69px] max-w-7xl items-center justify-between gap-2',
          headerPadding,
        )}
      >
        <Link to="/" className="shrink-0">
          <Logo className="h-6 w-[100px]" />
        </Link>

        <nav
          aria-label="Principal"
          className="flex min-w-0 flex-1 items-center justify-center gap-2 overflow-x-auto sm:gap-5"
        >
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={'end' in link ? link.end : undefined}
              className={({ isActive }) =>
                cn(
                  'shrink-0 text-xs leading-5 sm:text-sm',
                  isActive
                    ? 'font-semibold text-brand-base'
                    : 'font-normal text-gray-600 hover:text-gray-800',
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <Link
          to="/profile"
          aria-label="Perfil"
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gray-300 text-sm font-medium text-gray-800"
        >
          {initials}
        </Link>
      </div>
    </header>
  )
}
