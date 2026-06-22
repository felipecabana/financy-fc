import { Logo } from '@/components/Logo'

export function Header() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-14 max-w-7xl items-center px-4">
        <Logo />
      </div>
    </header>
  )
}
