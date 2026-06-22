import { z } from 'zod'

export const signupSchema = z.object({
  name: z.string().trim().min(1, 'Preencha o nome completo.'),
  email: z.string().trim().min(1, 'Preencha o e-mail.').email('Informe um e-mail válido.'),
  password: z.string().min(8, 'A senha deve ter no mínimo 8 caracteres.'),
})
