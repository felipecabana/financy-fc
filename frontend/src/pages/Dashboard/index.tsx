import { useMemo, useState } from 'react'

import { Page } from '@/components/Page'
import type { Category, Transaction } from '@/types'

import { CategoriesSection } from './components/CategoriesSection'
import { CategoryDialog } from './components/CategoryDialog'
import { CategoryList, type CategoryListRow } from './components/CategoryList'
import { SummaryCards } from './components/SummaryCards'
import { TransactionDialog } from './components/TransactionDialog'
import { TransactionList } from './components/TransactionList'
import { TransactionsSection } from './components/TransactionsSection'
import { useDashboardData } from './useDashboardData'

function buildCategoryRows(categories: Category[], transactions: Transaction[]): CategoryListRow[] {
  return categories.map((category) => {
    const linked = transactions.filter((transaction) => transaction.categoryId === category.id)
    const totalAmount = linked.reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0)

    return {
      id: category.id,
      name: category.name,
      itemCount: linked.length,
      totalAmount,
    }
  })
}

export function Dashboard() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [categoryDialogMode, setCategoryDialogMode] = useState<'create' | 'edit'>('create')
  const [editingCategory, setEditingCategory] = useState<Category | undefined>()

  const { categories, transactions, loading, error, refetchCategories, refetchTransactions } =
    useDashboardData()

  const categoryRows = useMemo(
    () => buildCategoryRows(categories, transactions),
    [categories, transactions],
  )

  function openCreateCategory() {
    setCategoryDialogMode('create')
    setEditingCategory(undefined)
    setCategoryDialogOpen(true)
  }

  function openEditCategory(id: string) {
    const category = categories.find((item) => item.id === id)
    if (!category) return

    setCategoryDialogMode('edit')
    setEditingCategory(category)
    setCategoryDialogOpen(true)
  }

  return (
    <div className="min-h-full bg-gray-100">
      <Page className="px-12 py-12">
        {error && (
          <p className="mb-6 text-sm text-danger" role="alert">
            Não foi possível carregar os dados do dashboard.
          </p>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <SummaryCards loading={loading} />
          <TransactionsSection
            loading={loading}
            onNewTransaction={() => setCreateDialogOpen(true)}
          >
            <TransactionList transactions={transactions} />
          </TransactionsSection>
          <CategoriesSection loading={loading} onNewCategory={openCreateCategory}>
            <CategoryList rows={categoryRows} onEdit={openEditCategory} />
          </CategoriesSection>
        </div>
      </Page>

      <TransactionDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        mode="create"
        categories={categories}
        onSuccess={() => void refetchTransactions()}
      />

      <CategoryDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        mode={categoryDialogMode}
        category={editingCategory}
        onSuccess={() => void refetchCategories()}
      />
    </div>
  )
}
