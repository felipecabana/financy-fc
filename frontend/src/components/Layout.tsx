import type { ReactNode } from 'react'
import { Toaster } from 'sonner'

import { Header } from '@/components/Header'

type LayoutProps = {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <Header />
      <main className="flex-1">{children}</main>
      <Toaster richColors position="top-right" />
    </div>
  )
}
