import { CircleDollarSign } from 'lucide-react'

export function Header() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-4">
        <CircleDollarSign className="size-5 text-brand-base" aria-hidden />
        <span className="text-lg font-semibold text-brand-base">Financy</span>
      </div>
    </header>
  )
}
