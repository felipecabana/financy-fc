import { useMutation } from '@apollo/client/react'
import { LinkError } from '@apollo/client/errors'
import { Plus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { Page } from '@/components/Page'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  DELETE_TRANSACTION,
  type DeleteTransactionMutationData,
  type DeleteTransactionMutationVariables,
} from '@/lib/graphql/mutations'
import { DeleteConfirmDialog } from '@/pages/Dashboard/components/DeleteConfirmDialog'
import { TransactionDialog } from '@/pages/Dashboard/components/TransactionDialog'
import { TransactionList } from '@/pages/Dashboard/components/TransactionList'
import { useDashboardData } from '@/pages/Dashboard/useDashboardData'
import type { Transaction } from '@/types'

import { TransactionFiltersSection } from './components/TransactionFilters'
import { PAGE_SIZE, TransactionPagination } from './components/TransactionPagination'
import {
  createDefaultTransactionFilters,
  filterTransactions,
  type TransactionFilters,
} from './filterTransactions'

function getDeleteTransactionErrorMessage(error: unknown) {
  return LinkError.is(error)
    ? 'Falha de conexão. Tente novamente.'
    : 'Falha ao excluir a transação.'
}

export function Transactions() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create')
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | undefined>()
  const [filters, setFilters] = useState<TransactionFilters>(createDefaultTransactionFilters)
  const [page, setPage] = useState(1)

  const { categories, transactions, loading, error, refetchTransactions } = useDashboardData()

  const filteredTransactions = useMemo(
    () => filterTransactions(transactions, filters),
    [transactions, filters],
  )

  const paginatedTransactions = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filteredTransactions.slice(start, start + PAGE_SIZE)
  }, [filteredTransactions, page])

  useEffect(() => {
    setPage(1)
  }, [filters])

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / PAGE_SIZE))
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [filteredTransactions.length, page])

  const [deleteTransaction, { loading: deletingLoading }] = useMutation<
    DeleteTransactionMutationData,
    DeleteTransactionMutationVariables
  >(DELETE_TRANSACTION, {
    onCompleted() {
      toast.success('Transação excluída com sucesso')
      setDeleteOpen(false)
      setDeletingTransaction(undefined)
      void refetchTransactions()
    },
    onError(error) {
      toast.error(getDeleteTransactionErrorMessage(error))
    },
  })

  function openCreate() {
    setDialogMode('create')
    setEditingTransaction(undefined)
    setDialogOpen(true)
  }

  function openEdit(id: string) {
    const transaction = transactions.find((item) => item.id === id)
    if (!transaction) return

    setDialogMode('edit')
    setEditingTransaction(transaction)
    setDialogOpen(true)
  }

  function openDelete(id: string) {
    const transaction = transactions.find((item) => item.id === id)
    if (!transaction) return

    setDeletingTransaction(transaction)
    setDeleteOpen(true)
  }

  function handleDeleteOpenChange(open: boolean) {
    if (deletingLoading) return
    setDeleteOpen(open)
    if (!open) setDeletingTransaction(undefined)
  }

  function confirmDelete() {
    if (!deletingTransaction?.id) return
    void deleteTransaction({ variables: { id: deletingTransaction.id } })
  }

  const emptyMessage =
    transactions.length === 0
      ? 'Nenhuma transação cadastrada.'
      : 'Nenhuma transação encontrada.'

  return (
    <>
      <Page>
        {error && (
          <p className="mb-6 text-sm text-danger" role="alert">
            Não foi possível carregar as transações.
          </p>
        )}

        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Transações</h1>
            <p className="text-base text-gray-600">
              Gerencie todas as suas transações financeiras
            </p>
          </div>
          <Button type="button" className="gap-2" onClick={openCreate}>
            <Plus className="size-4" />
            Nova transação
          </Button>
        </div>

        <TransactionFiltersSection
          filters={filters}
          categories={categories}
          transactions={transactions}
          onChange={setFilters}
        />

        <Card className="gap-0 overflow-hidden rounded-xl p-0 shadow-none">
          {loading ? (
            <p className="px-6 py-8 text-center text-sm text-gray-500">Carregando transações...</p>
          ) : (
            <>
              <TransactionList
                variant="page"
                transactions={paginatedTransactions}
                emptyMessage={emptyMessage}
                onEdit={openEdit}
                onDelete={openDelete}
              />
              {filteredTransactions.length > 0 && (
                <TransactionPagination
                  page={page}
                  totalItems={filteredTransactions.length}
                  onPageChange={setPage}
                />
              )}
            </>
          )}
        </Card>
      </Page>

      <TransactionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        categories={categories}
        transaction={editingTransaction}
        onSuccess={() => void refetchTransactions()}
      />

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={handleDeleteOpenChange}
        title="Excluir transação"
        description={
          deletingTransaction
            ? `Tem certeza que deseja excluir "${deletingTransaction.title}"? Esta ação não pode ser desfeita.`
            : 'Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.'
        }
        loading={deletingLoading}
        onConfirm={confirmDelete}
      />
    </>
  )
}
