import { useMutation } from '@apollo/client/react'
import { LinkError } from '@apollo/client/errors'
import { ArrowUpDown, LayoutGrid, Tag } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { Page } from '@/components/Page'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  DELETE_CATEGORY,
  type DeleteCategoryMutationData,
  type DeleteCategoryMutationVariables,
} from '@/lib/graphql/mutations'
import { CategoryDialog } from '@/pages/Dashboard/components/CategoryDialog'
import { CategoryList, type CategoryListRow } from '@/pages/Dashboard/components/CategoryList'
import { DeleteConfirmDialog } from '@/pages/Dashboard/components/DeleteConfirmDialog'
import { useDashboardData } from '@/pages/Dashboard/useDashboardData'
import type { Category, Transaction } from '@/types'

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
      description: category.description,
      icon: category.icon,
      color: category.color,
      itemCount: linked.length,
      totalAmount,
    }
  })
}

function getMostUsedCategory(rows: CategoryListRow[]) {
  if (rows.length === 0) return '—'

  const top = rows.reduce((best, row) => (row.itemCount > best.itemCount ? row : best), rows[0]!)
  return top.itemCount > 0 ? top.name : '—'
}

type SummaryStatProps = {
  label: string
  value: string
  icon: typeof LayoutGrid
  loading: boolean
}

function SummaryStat({ label, value, icon: Icon, loading }: SummaryStatProps) {
  return (
    <Card className="gap-4 rounded-xl p-6 shadow-none">
      <div className="flex items-center gap-4">
        <Icon className="size-6 shrink-0 text-gray-600" />
        <div className="min-w-0">
          {loading ? (
            <div className="h-8 w-24 animate-pulse rounded-md bg-gray-200" />
          ) : (
            <p className="text-[28px] leading-8 font-bold text-gray-800">{value}</p>
          )}
          <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">{label}</p>
        </div>
      </div>
    </Card>
  )
}

export function Categories() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create')
  const [editingCategory, setEditingCategory] = useState<Category | undefined>()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingCategory, setDeletingCategory] = useState<Category | undefined>()

  const { categories, transactions, loading, error, refetchCategories, refetchTransactions } =
    useDashboardData()

  const [deleteCategory, { loading: deletingLoading }] = useMutation<
    DeleteCategoryMutationData,
    DeleteCategoryMutationVariables
  >(DELETE_CATEGORY, {
    onCompleted() {
      toast.success('Categoria excluída com sucesso')
      setDeleteOpen(false)
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

  const mostUsedCategory = useMemo(() => getMostUsedCategory(categoryRows), [categoryRows])

  function openCreate() {
    setDialogMode('create')
    setEditingCategory(undefined)
    setDialogOpen(true)
  }

  function openEdit(id: string) {
    const category = categories.find((item) => item.id === id)
    if (!category) return

    setDialogMode('edit')
    setEditingCategory(category)
    setDialogOpen(true)
  }

  function openDelete(id: string) {
    const category = categories.find((item) => item.id === id)
    if (!category) return

    setDeletingCategory(category)
    setDeleteOpen(true)
  }

  function handleDeleteOpenChange(open: boolean) {
    if (deletingLoading) return
    setDeleteOpen(open)
    if (!open) setDeletingCategory(undefined)
  }

  function confirmDelete() {
    if (!deletingCategory?.id) return
    void deleteCategory({ variables: { id: deletingCategory.id } })
  }

  return (
    <>
      <Page>
        {error && (
          <p className="mb-6 text-sm text-danger" role="alert">
            Não foi possível carregar as categorias.
          </p>
        )}

        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Categorias</h1>
            <p className="text-base text-gray-600">
              Organize suas transações por categorias
            </p>
          </div>
          <Button type="button" className="gap-2" onClick={openCreate}>
            <Tag className="size-4" />
            Nova categoria
          </Button>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <SummaryStat
            label="total de categorias"
            value={String(categories.length)}
            icon={LayoutGrid}
            loading={loading}
          />
          <SummaryStat
            label="total de transações"
            value={String(transactions.length)}
            icon={ArrowUpDown}
            loading={loading}
          />
          <SummaryStat
            label="categoria mais utilizada"
            value={mostUsedCategory}
            icon={Tag}
            loading={loading}
          />
        </div>

        {loading ? (
          <p className="text-center text-sm text-gray-500">Carregando categorias...</p>
        ) : (
          <CategoryList
            variant="page"
            rows={categoryRows}
            onEdit={openEdit}
            onDelete={openDelete}
          />
        )}
      </Page>

      <CategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        category={editingCategory}
        onSuccess={() => void refetchCategories()}
      />

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={handleDeleteOpenChange}
        title="Excluir categoria"
        description={
          deletingCategory
            ? `Tem certeza que deseja excluir "${deletingCategory.name}"? Esta ação não pode ser desfeita.`
            : 'Tem certeza que deseja excluir esta categoria? Esta ação não pode ser desfeita.'
        }
        loading={deletingLoading}
        onConfirm={confirmDelete}
      />
    </>
  )
}
