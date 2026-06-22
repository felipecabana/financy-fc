import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

type PageProps = {
  children: ReactNode
  className?: string
}

export function Page({ children, className }: PageProps) {
  return (
    <div className={cn('mx-auto w-full max-w-7xl px-4 py-6', className)}>
      {children}
    </div>
  )
}
