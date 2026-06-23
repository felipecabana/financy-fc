import { useMutation } from '@apollo/client/react'
import { LinkError } from '@apollo/client/errors'
import { CircleArrowDown, CircleArrowUp, ChevronDown } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  CREATE_TRANSACTION,
  UPDATE_TRANSACTION,
  type CreateTransactionMutationData,
  type CreateTransactionMutationVariables,
  type UpdateTransactionMutationData,
  type UpdateTransactionMutationVariables,
} from '@/lib/graphql/mutations'
import { cn } from '@/lib/utils'
import type { Category, CreateTransactionInput, Transaction } from '@/types'

import {
  transactionSchema,
  type TransactionFormValues,
} from '../transaction-schema'
import { FormDialogBody, FormDialogHeader } from './FormDialogHeader'

type TransactionType = TransactionFormValues['type']

type TransactionDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  categories: Category[]
  transaction?: Transaction
  onSuccess?: () => void
}

function toInputDate(iso: string) {
  return iso.slice(0, 10)
}

function resolveType(type: string): TransactionType {
  return type.toLowerCase() === 'receita' ? 'receita' : 'despesa'
}

function toMutationInput(data: TransactionFormValues): CreateTransactionInput {
  return {
    title: data.title,
    amount: data.amount,
    type: data.type,
    categoryId: data.categoryId ?? null,
  }
}

function getMutationErrorMessage(error: unknown) {
  return LinkError.is(error)
    ? 'Falha de conexão. Tente novamente.'
    : 'Falha ao salvar a transação.'
}

export function TransactionDialog({
  open,
  onOpenChange,
  mode,
  categories,
  transaction,
  onSuccess,
}: TransactionDialogProps) {
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [amount, setAmount] = useState('')
  const [type, setType] = useState<TransactionType>('despesa')
  const [categoryId, setCategoryId] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const isEdit = mode === 'edit'

  const [createTransaction, { loading: creating }] = useMutation<
    CreateTransactionMutationData,
    CreateTransactionMutationVariables
  >(CREATE_TRANSACTION, {
    onCompleted() {
      toast.success('Transação criada com sucesso')
      onOpenChange(false)
      onSuccess?.()
    },
    onError(error) {
      const message = getMutationErrorMessage(error)
      setFormError(message)
      toast.error(message)
    },
  })

  const [updateTransaction, { loading: updating }] = useMutation<
    UpdateTransactionMutationData,
    UpdateTransactionMutationVariables
  >(UPDATE_TRANSACTION, {
    onCompleted() {
      toast.success('Transação atualizada com sucesso')
      onOpenChange(false)
      onSuccess?.()
    },
    onError(error) {
      const message = getMutationErrorMessage(error)
      setFormError(message)
      toast.error(message)
    },
  })

  const loading = creating || updating

  useEffect(() => {
    if (!open) return

    setFormError(null)

    if (isEdit && transaction) {
      setTitle(transaction.title)
      setDate(toInputDate(transaction.createdAt))
      setAmount(String(transaction.amount))
      setType(resolveType(transaction.type))
      setCategoryId(transaction.categoryId ?? '')
      return
    }

    setTitle('')
    setDate('')
    setAmount('')
    setType('despesa')
    setCategoryId('')
  }, [open, isEdit, transaction])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFormError(null)

    const parsed = transactionSchema.safeParse({
      title,
      date,
      amount,
      type,
      categoryId,
    })

    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'Dados inválidos.')
      return
    }

    const data = toMutationInput(parsed.data)

    if (isEdit) {
      if (!transaction?.id) {
        setFormError('Transação inválida.')
        return
      }

      void updateTransaction({
        variables: {
          id: transaction.id,
          data,
        },
      })
      return
    }

    void createTransaction({ variables: { data } })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="gap-6 rounded-xl border-gray-200 p-[25px] shadow-none sm:max-w-[448px]"
      >
        <FormDialogHeader
          title={isEdit ? 'Editar transação' : 'Nova transação'}
          description="Registre sua despesa ou receita"
        />

        <div className="rounded-xl border border-gray-200 p-2">
          <div className="grid grid-cols-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => setType('despesa')}
              className={cn(
                'flex items-center justify-center gap-3 rounded-lg px-3 py-3.5 text-base transition-colors disabled:opacity-50',
                type === 'despesa'
                  ? 'border border-red-base bg-gray-100 font-medium text-gray-800'
                  : 'font-normal text-gray-600 hover:bg-gray-50',
              )}
            >
              <CircleArrowDown className="size-4 text-red-base" />
              Despesa
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => setType('receita')}
              className={cn(
                'flex items-center justify-center gap-3 rounded-lg px-3 py-3.5 text-base transition-colors disabled:opacity-50',
                type === 'receita'
                  ? 'border border-green-base bg-gray-100 font-medium text-gray-800'
                  : 'font-normal text-gray-600 hover:bg-gray-50',
              )}
            >
              <CircleArrowUp className="size-4 text-green-base" />
              Receita
            </button>
          </div>
        </div>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
          <FormDialogBody>
          <div className="flex flex-col gap-2">
            <Label htmlFor="transaction-title">Descrição</Label>
            <Input
              id="transaction-title"
              placeholder="Ex. Almoço no restaurante"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
              aria-invalid={!!formError}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="transaction-date">Data</Label>
              <Input
                id="transaction-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={loading}
                aria-invalid={!!formError}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="transaction-amount">Valor</Label>
              <div className="relative">
                <span className="pointer-events-none absolute top-1/2 left-[13px] -translate-y-1/2 text-base text-gray-800">
                  R$
                </span>
                <Input
                  id="transaction-amount"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={loading}
                  className="pl-10"
                  aria-invalid={!!formError}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="transaction-category">Categoria</Label>
            <div className="relative">
              <select
                id="transaction-category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                disabled={loading || categories.length === 0}
                className={cn(
                  'h-auto min-h-12 w-full appearance-none rounded-lg border border-input bg-white px-[13px] py-[15px] pr-10 text-base text-foreground transition-colors outline-none disabled:cursor-not-allowed disabled:opacity-50',
                  !categoryId && 'text-gray-400',
                )}
              >
                <option value="">Selecione</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute top-1/2 right-[13px] size-4 -translate-y-1/2 text-gray-400"
                aria-hidden
              />
            </div>
          </div>
          </FormDialogBody>

          {formError && (
            <p className="text-sm text-destructive" role="alert">
              {formError}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            Salvar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
