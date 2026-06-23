import { useMutation } from '@apollo/client/react'
import { LinkError } from '@apollo/client/errors'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { Page } from '@/components/Page'
import {
  DELETE_CATEGORY,
  DELETE_TRANSACTION,
  type DeleteCategoryMutationData,
  type DeleteCategoryMutationVariables,
  type DeleteTransactionMutationData,
  type DeleteTransactionMutationVariables,
} from '@/lib/graphql/mutations'
import type { Category, Transaction } from '@/types'

import { CategoriesSection } from './components/CategoriesSection'
import { CategoryDialog } from './components/CategoryDialog'
import { CategoryList, type CategoryListRow } from './components/CategoryList'
import { DeleteConfirmDialog } from './components/DeleteConfirmDialog'
import { SummaryCards } from './components/SummaryCards'
import { TransactionDialog } from './components/TransactionDialog'
import { TransactionList } from './components/TransactionList'
import { TransactionsSection } from './components/TransactionsSection'
import { useDashboardData } from './useDashboardData'

function getDeleteTransactionErrorMessage(error: unknown) {
  return LinkError.is(error)
    ? 'Falha de conexão. Tente novamente.'
    : 'Falha ao excluir a transação.'
}

function getDeleteCategoryErrorMessage(error: unknown) {
  return LinkError.is(error)
    ? 'Falha de conexão. Tente novamente.'
    : 'Falha ao excluir a categoria.'
}

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
  const [deleteTransactionOpen, setDeleteTransactionOpen] = useState(false)
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | undefined>()
  const [deleteCategoryOpen, setDeleteCategoryOpen] = useState(false)
  const [deletingCategory, setDeletingCategory] = useState<Category | undefined>()

  const { categories, transactions, loading, error, refetchCategories, refetchTransactions } =
    useDashboardData()

  const [deleteTransaction, { loading: deletingTransactionLoading }] = useMutation<
    DeleteTransactionMutationData,
    DeleteTransactionMutationVariables
  >(DELETE_TRANSACTION, {
    onCompleted() {
      toast.success('Transação excluída com sucesso')
      setDeleteTransactionOpen(false)
      setDeletingTransaction(undefined)
      void refetchTransactions()
    },
    onError(error) {
      toast.error(getDeleteTransactionErrorMessage(error))
    },
  })

  const [deleteCategory, { loading: deletingCategoryLoading }] = useMutation<
    DeleteCategoryMutationData,
    DeleteCategoryMutationVariables
  >(DELETE_CATEGORY, {
    onCompleted() {
      toast.success('Categoria excluída com sucesso')
      setDeleteCategoryOpen(false)
      setDeletingCategory(undefined)
      void refetchCategories()
      void refetchTransactions()
    },
    onError(error) {
      toast.error(getDeleteCategoryErrorMessage(error))
    },
  })

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

  function openDeleteTransaction(id: string) {
    const transaction = transactions.find((item) => item.id === id)
    if (!transaction) return

    setDeletingTransaction(transaction)
    setDeleteTransactionOpen(true)
  }

  function handleDeleteTransactionOpenChange(open: boolean) {
    if (deletingTransactionLoading) return
    setDeleteTransactionOpen(open)
    if (!open) setDeletingTransaction(undefined)
  }

  function confirmDeleteTransaction() {
    if (!deletingTransaction?.id) return

    void deleteTransaction({ variables: { id: deletingTransaction.id } })
  }

  function openDeleteCategory(id: string) {
    const category = categories.find((item) => item.id === id)
    if (!category) return

    setDeletingCategory(category)
    setDeleteCategoryOpen(true)
  }

  function handleDeleteCategoryOpenChange(open: boolean) {
    if (deletingCategoryLoading) return
    setDeleteCategoryOpen(open)
    if (!open) setDeletingCategory(undefined)
  }

  function confirmDeleteCategory() {
    if (!deletingCategory?.id) return

    void deleteCategory({ variables: { id: deletingCategory.id } })
  }

  return (
    <>
      <Page>
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
            <TransactionList transactions={transactions} onDelete={openDeleteTransaction} />
          </TransactionsSection>
          <CategoriesSection loading={loading} onNewCategory={openCreateCategory}>
            <CategoryList
              rows={categoryRows}
              onEdit={openEditCategory}
              onDelete={openDeleteCategory}
            />
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

      <DeleteConfirmDialog
        open={deleteTransactionOpen}
        onOpenChange={handleDeleteTransactionOpenChange}
        title="Excluir transação"
        description={
          deletingTransaction
            ? `Tem certeza que deseja excluir "${deletingTransaction.title}"? Esta ação não pode ser desfeita.`
            : 'Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.'
        }
        loading={deletingTransactionLoading}
        onConfirm={confirmDeleteTransaction}
      />

      <DeleteConfirmDialog
        open={deleteCategoryOpen}
        onOpenChange={handleDeleteCategoryOpenChange}
        title="Excluir categoria"
        description={
          deletingCategory
            ? `Tem certeza que deseja excluir "${deletingCategory.name}"? Esta ação não pode ser desfeita.`
            : 'Tem certeza que deseja excluir esta categoria? Esta ação não pode ser desfeita.'
        }
        loading={deletingCategoryLoading}
        onConfirm={confirmDeleteCategory}
      />
    </>
  )
}
