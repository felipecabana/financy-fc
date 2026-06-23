import { X } from 'lucide-react'
import type { ReactNode } from 'react'

import {
  DialogClose,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'

type FormDialogHeaderProps = {
  title: string
  description: string
}

export function FormDialogHeader({ title, description }: FormDialogHeaderProps) {
  return (
    <div className="flex items-start gap-4">
      <div className="min-w-0 flex-1">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription className="text-sm text-gray-600">{description}</DialogDescription>
      </div>
      <DialogClose asChild>
        <button
          type="button"
          className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-800 transition-colors hover:bg-gray-50"
          aria-label="Fechar"
        >
          <X className="size-4" aria-hidden />
        </button>
      </DialogClose>
    </div>
  )
}

export function FormDialogBody({ children }: { children: ReactNode }) {
  return <div className="flex w-full flex-col gap-4">{children}</div>
}
