import { ChevronDown, Search } from 'lucide-react'
import type { ReactNode } from 'react'

import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { Category } from '@/types'

import {
  formatPeriodLabel,
  getTransactionPeriods,
  sortCategoriesForFilter,
  type TransactionFilters,
} from '../filterTransactions'

type TransactionFiltersProps = {
  filters: TransactionFilters
  categories: Category[]
  transactions: { date: string }[]
  onChange: (filters: TransactionFilters) => void
}

type FilterSelectProps = {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  children: ReactNode
}

const selectClassName = cn(
  'h-auto min-h-12 w-full appearance-none rounded-lg border border-input bg-white px-[13px] py-[15px] pr-10 text-base text-foreground transition-colors outline-none',
)

function FilterSelect({ id, label, value, onChange, children }: FilterSelectProps) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={selectClassName}
        >
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute top-1/2 right-[13px] size-4 -translate-y-1/2 text-gray-400"
          aria-hidden
        />
      </div>
    </div>
  )
}

export function TransactionFiltersSection({
  filters,
  categories,
  transactions,
  onChange,
}: TransactionFiltersProps) {
  const periods = getTransactionPeriods(transactions)
  const sortedCategories = sortCategoriesForFilter(categories)

  function updateFilters(patch: Partial<TransactionFilters>) {
    onChange({ ...filters, ...patch })
  }

  return (
    <Card className="mb-8 gap-0 rounded-xl px-[25px] py-[21px] shadow-none">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="transaction-search">Buscar</Label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-[13px] size-4 -translate-y-1/2 text-gray-400"
              aria-hidden
            />
            <Input
              id="transaction-search"
              placeholder="Buscar por descrição"
              value={filters.search}
              onChange={(event) => updateFilters({ search: event.target.value })}
              className="pl-10"
            />
          </div>
        </div>

        <FilterSelect
          id="transaction-type-filter"
          label="Tipo"
          value={filters.type}
          onChange={(value) => updateFilters({ type: value as TransactionFilters['type'] })}
        >
          <option value="all">Todos</option>
          <option value="receita">Entrada</option>
          <option value="despesa">Saída</option>
        </FilterSelect>

        <FilterSelect
          id="transaction-category-filter"
          label="Categoria"
          value={filters.categoryId}
          onChange={(value) => updateFilters({ categoryId: value })}
        >
          <option value="all">Todas</option>
          {sortedCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect
          id="transaction-period-filter"
          label="Período"
          value={filters.period}
          onChange={(value) => updateFilters({ period: value })}
        >
          <option value="all">Todos os períodos</option>
          {periods.map((period) => (
            <option key={period} value={period}>
              {formatPeriodLabel(period)}
            </option>
          ))}
        </FilterSelect>
      </div>
    </Card>
  )
}
