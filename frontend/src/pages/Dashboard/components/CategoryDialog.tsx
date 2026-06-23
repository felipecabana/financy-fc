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
import { categoryIconOptions } from '@/lib/category-icons'
import { cn } from '@/lib/utils'
import type { Category } from '@/types'

import { categoryColors, categoryIcons, categorySchema } from '../category-schema'
import { FormDialogBody, FormDialogHeader } from './FormDialogHeader'

type CategoryDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  category?: Category
  onSuccess?: () => void
}

type CategoryColor = (typeof categoryColors)[number]
type CategoryIcon = (typeof categoryIcons)[number]

const colorOptions: { id: CategoryColor; className: string }[] = [
  { id: 'green', className: 'bg-green-base' },
  { id: 'blue', className: 'bg-blue-base' },
  { id: 'purple', className: 'bg-purple-base' },
  { id: 'pink', className: 'bg-pink-base' },
  { id: 'red', className: 'bg-red-base' },
  { id: 'orange', className: 'bg-orange-base' },
  { id: 'yellow', className: 'bg-yellow-base' },
]

function getMutationErrorMessage(error: unknown) {
  return LinkError.is(error)
    ? 'Falha de conexão. Tente novamente.'
    : 'Falha ao salvar a categoria.'
}

function toFormIcon(value?: string | null): CategoryIcon | '' {
  if (value && categoryIcons.includes(value as CategoryIcon)) {
    return value as CategoryIcon
  }
  return ''
}

function toFormColor(value?: string | null): CategoryColor | '' {
  if (value && categoryColors.includes(value as CategoryColor)) {
    return value as CategoryColor
  }
  return ''
}

export function CategoryDialog({
  open,
  onOpenChange,
  mode,
  category,
  onSuccess,
}: CategoryDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState<CategoryIcon | ''>('')
  const [color, setColor] = useState<CategoryColor | ''>('')
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

    if (isEdit && category) {
      setName(category.name)
      setDescription(category.description ?? '')
      setIcon(toFormIcon(category.icon))
      setColor(toFormColor(category.color))
      return
    }

    setName('')
    setDescription('')
    setIcon('')
    setColor('')
  }, [open, isEdit, category])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFormError(null)

    const parsed = categorySchema.safeParse({
      name,
      description,
      icon: icon || undefined,
      color: color || undefined,
    })

    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'Dados inválidos.')
      return
    }

    const data = {
      name: parsed.data.name,
      icon: parsed.data.icon,
      color: parsed.data.color,
      description: parsed.data.description ?? null,
    }

    if (isEdit) {
      if (!category?.id) {
        setFormError('Categoria inválida.')
        return
      }

      void updateCategory({
        variables: {
          id: category.id,
          data,
        },
      })
      return
    }

    void createCategory({ variables: { data } })
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

            <div className="flex flex-col gap-2">
              <Label htmlFor="category-description">Descrição</Label>
              <textarea
                id="category-description"
                placeholder="Descrição da categoria"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
                rows={1}
                className="min-h-[52px] w-full resize-none rounded-lg border border-gray-300 bg-white px-[13px] py-[15px] text-base text-gray-800 placeholder:text-gray-400 focus-visible:border-brand-base focus-visible:outline-none disabled:opacity-50"
              />
              <p className="text-xs text-gray-500">Opcional</p>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-gray-700">Ícone</span>
              <div className="flex flex-wrap gap-2">
                {categoryIconOptions.map(({ id, Icon }) => {
                  const selected = icon === id

                  return (
                    <button
                      key={id}
                      type="button"
                      aria-label={id}
                      aria-pressed={selected}
                      disabled={loading}
                      onClick={() => setIcon(id)}
                      className={cn(
                        'flex size-[42px] items-center justify-center rounded-lg border border-gray-300 p-[13px]',
                        selected && 'border-brand-base bg-gray-100',
                      )}
                    >
                      <Icon className="size-5 text-gray-800" />
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-gray-700">Cor</span>
              <div className="flex gap-2">
                {colorOptions.map(({ id, className }) => {
                  const selected = color === id

                  return (
                    <button
                      key={id}
                      type="button"
                      aria-label={id}
                      aria-pressed={selected}
                      disabled={loading}
                      onClick={() => setColor(id)}
                      className={cn(
                        'flex flex-1 items-center justify-center rounded-lg border border-gray-300 p-[5px]',
                        selected && 'border-brand-base bg-gray-100',
                      )}
                    >
                      <span className={cn('h-5 w-full rounded', className)} />
                    </button>
                  )
                })}
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
