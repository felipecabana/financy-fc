import type { ReactNode } from 'react'
import { Toaster } from 'sonner'

import { Header } from '@/components/Header'

type LayoutProps = {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex min-h-svh flex-col">
      <Header />
      <main className="flex flex-1 flex-col bg-gray-100">{children}</main>
      <Toaster richColors position="top-right" />
    </div>
  )
}
