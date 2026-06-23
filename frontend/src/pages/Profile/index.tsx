import { useMutation } from '@apollo/client/react'
import { LinkError } from '@apollo/client/errors'
import { LogOut, Mail, UserRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { Page } from '@/components/Page'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  LOGOUT_MUTATION,
  UPDATE_USER,
  type UpdateUserMutationData,
  type UpdateUserMutationVariables,
} from '@/lib/graphql/mutations'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth'
import type { User } from '@/types'

function getUserInitials(user: User) {
  const name = (user.name ?? '').trim()
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean)
    if (parts.length >= 2) {
      const first = parts[0]?.[0] ?? ''
      const last = parts[parts.length - 1]?.[0] ?? ''
      return `${first}${last}`.toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }

  return user.email.slice(0, 2).toUpperCase()
}

function getUpdateUserErrorMessage(error: unknown) {
  return LinkError.is(error)
    ? 'Falha de conexão. Tente novamente.'
    : 'Falha ao salvar o perfil.'
}

export function Profile() {
  const user = useAuthStore((state) => state.user)
  const setSession = useAuthStore((state) => state.setSession)
  const logout = useAuthStore((state) => state.logout)

  const [name, setName] = useState('')
  const [savedName, setSavedName] = useState('')

  const [updateUser, { loading: saving }] = useMutation<
    UpdateUserMutationData,
    UpdateUserMutationVariables
  >(UPDATE_USER, {
    onCompleted({ updateUser: updated }) {
      setSession(updated)
      setSavedName(updated.name.trim())
      toast.success('Perfil atualizado com sucesso')
    },
    onError(error) {
      toast.error(getUpdateUserErrorMessage(error))
    },
  })

  const [logoutMutation, { loading: loggingOut }] = useMutation(LOGOUT_MUTATION, {
    onCompleted() {
      logout()
    },
    onError() {
      logout()
    },
  })

  useEffect(() => {
    if (!user) return
    const trimmed = (user.name ?? '').trim() || user.email
    setName(trimmed)
    setSavedName(trimmed)
  }, [user])

  if (!user) return null

  const initials = getUserInitials(user)
  const trimmedName = name.trim()
  const canSave = trimmedName.length > 0 && trimmedName !== savedName && !saving

  const handleSave = () => {
    if (!canSave) return
    void updateUser({ variables: { data: { name: trimmedName } } })
  }

  const handleLogout = () => {
    void logoutMutation()
  }

  return (
    <Page className="flex flex-1 flex-col items-center">
      <Card className="w-full max-w-[448px] gap-8 rounded-xl border-gray-200 p-[33px] shadow-none">
        <div className="flex flex-col items-center gap-6">
          <div
            className="flex size-16 items-center justify-center rounded-full bg-gray-300 text-2xl font-medium text-gray-800"
            aria-label="Avatar"
          >
            {initials}
          </div>
          <div className="text-center">
            <h1 className="text-xl font-semibold text-gray-800">{savedName}</h1>
            <p className="text-base text-gray-500">{user.email}</p>
          </div>
        </div>

        <hr className="border-gray-200" />

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="profile-name">Nome completo</Label>
            <div className="relative">
              <UserRound
                className="pointer-events-none absolute top-1/2 left-[13px] size-4 -translate-y-1/2 text-gray-400"
                aria-hidden
              />
              <Input
                id="profile-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={saving}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="profile-email">E-mail</Label>
            <div className="relative">
              <Mail
                className="pointer-events-none absolute top-1/2 left-[13px] size-4 -translate-y-1/2 text-gray-400"
                aria-hidden
              />
              <Input
                id="profile-email"
                type="email"
                readOnly
                disabled
                value={user.email}
                className="pl-10"
              />
            </div>
            <p className="text-xs text-gray-500">O e-mail não pode ser alterado</p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <Button type="button" className="w-full" disabled={!canSave} onClick={handleSave}>
            Salvar alterações
          </Button>
          <Button
            type="button"
            variant="outline"
            className={cn('w-full text-red-base hover:text-red-base')}
            disabled={loggingOut || saving}
            onClick={handleLogout}
          >
            <LogOut className="text-red-base" />
            Sair da conta
          </Button>
        </div>
      </Card>
    </Page>
  )
}
