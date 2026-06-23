import { useMutation } from '@apollo/client/react'
import { LinkError } from '@apollo/client/errors'
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
  CREATE_CATEGORY,
  UPDATE_CATEGORY,
  type CreateCategoryMutationData,
  type CreateCategoryMutationVariables,
  type UpdateCategoryMutationData,
  type UpdateCategoryMutationVariables,
} from '@/lib/graphql/mutations'
import type { Category } from '@/types'

import { categorySchema } from '../category-schema'
import { FormDialogBody, FormDialogHeader } from './FormDialogHeader'

type CategoryDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  category?: Category
  onSuccess?: () => void
}

function getMutationErrorMessage(error: unknown) {
  return LinkError.is(error)
    ? 'Falha de conexão. Tente novamente.'
    : 'Falha ao salvar a categoria.'
}

export function CategoryDialog({
  open,
  onOpenChange,
  mode,
  category,
  onSuccess,
}: CategoryDialogProps) {
  const [name, setName] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const isEdit = mode === 'edit'

  const [createCategory, { loading: creating }] = useMutation<
    CreateCategoryMutationData,
    CreateCategoryMutationVariables
  >(CREATE_CATEGORY, {
    onCompleted() {
      toast.success('Categoria criada com sucesso')
      onOpenChange(false)
      onSuccess?.()
    },
    onError(error) {
      const message = getMutationErrorMessage(error)
      setFormError(message)
      toast.error(message)
    },
  })

  const [updateCategory, { loading: updating }] = useMutation<
    UpdateCategoryMutationData,
    UpdateCategoryMutationVariables
  >(UPDATE_CATEGORY, {
    onCompleted() {
      toast.success('Categoria atualizada com sucesso')
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
    setName(isEdit && category ? category.name : '')
  }, [open, isEdit, category])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFormError(null)

    const parsed = categorySchema.safeParse({ name })

    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'Dados inválidos.')
      return
    }

    if (isEdit) {
      if (!category?.id) {
        setFormError('Categoria inválida.')
        return
      }

      void updateCategory({
        variables: {
          id: category.id,
          data: { name: parsed.data.name },
        },
      })
      return
    }

    void createCategory({ variables: { data: { name: parsed.data.name } } })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="gap-6 rounded-xl border-gray-200 p-[25px] shadow-none sm:max-w-[448px]"
      >
        <FormDialogHeader
          title={isEdit ? 'Editar categoria' : 'Nova categoria'}
          description="Organize suas transações com categorias"
        />

        <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
          <FormDialogBody>
            <div className="flex flex-col gap-2">
              <Label htmlFor="category-name">Título</Label>
              <Input
                id="category-name"
                placeholder="Ex. Alimentação"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                aria-invalid={!!formError}
              />
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
