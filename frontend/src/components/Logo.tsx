import logo from '@/assets/logo.svg'
import { cn } from '@/lib/utils'

type LogoProps = {
  className?: string
}

export function Logo({ className }: LogoProps) {
  return (
    <img
      src={logo}
      alt="Financy"
      width={134}
      height={32}
      className={cn('h-8 w-[134px]', className)}
    />
  )
}
