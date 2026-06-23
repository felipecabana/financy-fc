import { useMutation } from '@apollo/client/react'
import { LinkError } from '@apollo/client/errors'
import { Eye, EyeOff, Lock, Mail, UserRoundPlus } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LOGIN_MUTATION, type LoginMutationData } from '@/lib/graphql/mutations'
import { useAuthStore } from '@/stores/auth'

import { loginSchema } from './login-schema'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const setSession = useAuthStore((state) => state.setSession)

  const [login, { loading }] = useMutation<LoginMutationData>(LOGIN_MUTATION, {
    onCompleted({ login }) {
      setSession(login.token, login.user)
      toast.success('Login realizado com sucesso')
    },
    onError(error) {
      const message = LinkError.is(error)
        ? 'Falha de conexão. Tente novamente.'
        : 'Credenciais inválidas.'
      setFormError(message)
      toast.error(message)
    },
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFormError(null)

    const parsed = loginSchema.safeParse({ email, password })
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'Dados inválidos.')
      return
    }

    void login({ variables: { data: parsed.data } })
  }

  return (
    <div className="flex flex-1 flex-col items-center gap-8 px-4 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12">
      <Logo />
      <Card className="w-full max-w-[448px] gap-8 rounded-xl border-gray-200 p-[33px] shadow-none">
        <div className="flex flex-col gap-1 text-center">
          <h1 className="text-xl leading-7 font-bold text-gray-800">Fazer login</h1>
          <p className="text-base leading-6 text-gray-600">Entre na sua conta para continuar</p>
        </div>

        <form className="flex flex-col gap-6" onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail
                  className="pointer-events-none absolute top-1/2 left-[13px] size-4 -translate-y-1/2 text-gray-400"
                  aria-hidden
                />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="mail@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="pl-10"
                  aria-invalid={!!formError}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute top-1/2 left-[13px] size-4 -translate-y-1/2 text-gray-400"
                  aria-hidden
                />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="px-10"
                  aria-invalid={!!formError}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  disabled={loading}
                  className="absolute top-1/2 right-[13px] -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600 disabled:pointer-events-none"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={loading}
                  className="size-4 rounded border border-gray-300 accent-brand-base"
                />
                Lembrar-me
              </label>
              <button type="button" className="text-sm font-medium text-brand-base hover:underline">
                Recuperar senha
              </button>
            </div>
          </div>

          {formError && (
            <p className="text-sm text-destructive" role="alert">
              {formError}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            Entrar
          </Button>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-300" />
            <span className="text-sm text-gray-500">ou</span>
            <div className="h-px flex-1 bg-gray-300" />
          </div>

          <div className="flex flex-col gap-4">
            <p className="text-center text-sm text-gray-600">Ainda não tem uma conta?</p>
            <Button asChild variant="outline" className="w-full" disabled={loading}>
              <Link to="/signup">
                <UserRoundPlus className="size-[18px]" />
                Criar conta
              </Link>
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
