import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().trim().min(1, 'Preencha o e-mail.').email('Informe um e-mail válido.'),
  password: z.string().min(1, 'Preencha a senha.'),
})
