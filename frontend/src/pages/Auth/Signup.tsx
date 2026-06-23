import { useMutation } from '@apollo/client/react'
import { LinkError } from '@apollo/client/errors'
import { Eye, EyeOff, Lock, LogIn, Mail, UserRound } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SIGNUP_MUTATION, type SignupMutationData } from '@/lib/graphql/mutations'
import { useAuthStore } from '@/stores/auth'

import { signupSchema } from './signup-schema'

export function Signup() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const setSession = useAuthStore((state) => state.setSession)

  const [signup, { loading }] = useMutation<SignupMutationData>(SIGNUP_MUTATION, {
    onCompleted({ signup }) {
      setSession(signup.user)
      toast.success('Conta criada com sucesso')
    },
    onError(error) {
      let message = 'Falha ao criar conta. Tente novamente.'
      if (LinkError.is(error)) {
        message = 'Falha de conexão. Tente novamente.'
      } else if (error.message?.includes('Email já cadastrado')) {
        message = 'Email já cadastrado.'
      }
      setFormError(message)
      toast.error(message)
    },
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFormError(null)

    const parsed = signupSchema.safeParse({ name, email, password })
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'Dados inválidos.')
      return
    }

    void signup({
      variables: {
        data: {
          name: parsed.data.name,
          email: parsed.data.email,
          password: parsed.data.password,
        },
      },
    })
  }

  return (
    <div className="flex flex-1 flex-col items-center gap-8 px-4 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12">
      <Logo />
      <Card className="w-full max-w-[448px] gap-8 rounded-xl border-gray-200 p-[33px] shadow-none">
        <div className="flex flex-col gap-1 text-center">
          <h1 className="text-xl leading-7 font-bold text-gray-800">Criar conta</h1>
          <p className="text-base leading-6 text-gray-600">
            Comece a controlar suas finanças ainda hoje
          </p>
        </div>

        <form className="flex flex-col gap-6" onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Nome completo</Label>
              <div className="relative">
                <UserRound
                  className="pointer-events-none absolute top-1/2 left-[13px] size-4 -translate-y-1/2 text-gray-400"
                  aria-hidden
                />
                <Input
                  id="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Seu nome completo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  className="pl-10"
                  aria-invalid={!!formError}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="signup-email">E-mail</Label>
              <div className="relative">
                <Mail
                  className="pointer-events-none absolute top-1/2 left-[13px] size-4 -translate-y-1/2 text-gray-400"
                  aria-hidden
                />
                <Input
                  id="signup-email"
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
              <Label htmlFor="signup-password">Senha</Label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute top-1/2 left-[13px] size-4 -translate-y-1/2 text-gray-400"
                  aria-hidden
                />
                <Input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
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
              <p className="text-xs text-gray-500">A senha deve ter no mínimo 8 caracteres</p>
            </div>
          </div>

          {formError && (
            <p className="text-sm text-destructive" role="alert">
              {formError}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            Cadastrar
          </Button>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-300" />
            <span className="text-sm text-gray-500">ou</span>
            <div className="h-px flex-1 bg-gray-300" />
          </div>

          <div className="flex flex-col gap-4">
            <p className="text-center text-sm text-gray-600">Já tem uma conta?</p>
            <Button asChild variant="outline" className="w-full" disabled={loading}>
              <Link to="/">
                <LogIn className="size-[18px]" />
                Fazer login
              </Link>
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
