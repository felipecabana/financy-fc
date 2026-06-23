import { CircleArrowDown, CircleArrowUp, Wallet } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

import type { TransactionSummary } from '../computeTransactionSummary'

type SummaryCardsProps = {
  loading: boolean
  summary: TransactionSummary
}

type SummaryCardProps = {
  label: string
  icon: LucideIcon
  iconClassName: string
  loading: boolean
  value: string
}

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

function SummaryCard({ label, icon: Icon, iconClassName, loading, value }: SummaryCardProps) {
  return (
    <Card className="gap-4 rounded-xl p-6 shadow-none">
      <div className="flex items-center gap-3">
        <Icon className={cn('size-5', iconClassName)} />
        <span className="text-xs font-medium tracking-wide text-gray-500 uppercase">{label}</span>
      </div>
      {loading ? (
        <div className="h-8 w-40 animate-pulse rounded-md bg-gray-200" />
      ) : (
        <p className="text-[32px] leading-8 font-bold text-gray-800">{value}</p>
      )}
    </Card>
  )
}

const cards = [
  {
    label: 'Saldo total',
    icon: Wallet,
    iconClassName: 'text-purple-base',
    getValue: (summary: TransactionSummary) => currencyFormatter.format(summary.balance),
  },
  {
    label: 'Receitas do mês',
    icon: CircleArrowUp,
    iconClassName: 'text-success',
    getValue: (summary: TransactionSummary) => currencyFormatter.format(summary.monthlyIncome),
  },
  {
    label: 'Despesas do mês',
    icon: CircleArrowDown,
    iconClassName: 'text-danger',
    getValue: (summary: TransactionSummary) => currencyFormatter.format(summary.monthlyExpenses),
  },
] as const

export function SummaryCards({ loading, summary }: SummaryCardsProps) {
  return (
    <>
      {cards.map((card) => (
        <SummaryCard
          key={card.label}
          label={card.label}
          icon={card.icon}
          iconClassName={card.iconClassName}
          loading={loading}
          value={card.getValue(summary)}
        />
      ))}
    </>
  )
}
