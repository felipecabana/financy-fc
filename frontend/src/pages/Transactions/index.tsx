import { useMutation } from '@apollo/client/react'
import { LinkError } from '@apollo/client/errors'
import { Plus } from 'lucide-react'
import { useState } from 'react'
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

  const { categories, transactions, loading, error, refetchTransactions } = useDashboardData()

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

        <Card className="gap-0 overflow-hidden rounded-xl p-0 shadow-none">
          {loading ? (
            <p className="px-6 py-8 text-center text-sm text-gray-500">Carregando transações...</p>
          ) : (
            <TransactionList
              variant="page"
              transactions={transactions}
              onEdit={openEdit}
              onDelete={openDelete}
            />
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
