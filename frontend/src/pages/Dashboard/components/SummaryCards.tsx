import { CircleArrowDown, CircleArrowUp, Wallet } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type SummaryCardsProps = {
  loading: boolean
}

type SummaryCardProps = {
  label: string
  icon: LucideIcon
  iconClassName: string
  loading: boolean
}

function SummaryCard({ label, icon: Icon, iconClassName, loading }: SummaryCardProps) {
  return (
    <Card className="gap-4 rounded-xl p-6 shadow-none">
      <div className="flex items-center gap-3">
        <Icon className={cn('size-5', iconClassName)} />
        <span className="text-xs font-medium tracking-wide text-gray-500 uppercase">{label}</span>
      </div>
      {loading ? (
        <div className="h-8 w-40 animate-pulse rounded-md bg-gray-200" />
      ) : (
        <p className="text-[28px] leading-8 font-bold text-gray-800">—</p>
      )}
    </Card>
  )
}

const cards = [
  { label: 'Saldo total', icon: Wallet, iconClassName: 'text-purple-base' },
  { label: 'Receitas do mês', icon: CircleArrowUp, iconClassName: 'text-success' },
  { label: 'Despesas do mês', icon: CircleArrowDown, iconClassName: 'text-danger' },
] as const

export function SummaryCards({ loading }: SummaryCardsProps) {
  return (
    <>
      {cards.map((card) => (
        <SummaryCard key={card.label} loading={loading} {...card} />
      ))}
    </>
  )
}
