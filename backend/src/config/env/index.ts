import 'dotenv/config'

import { z } from 'zod'

const envSchema = z.object({
  JWT_SECRET: z.string().min(1, 'JWT_SECRET é obrigatório'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL é obrigatório'),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  PORT: z.coerce.number().int().positive().default(4000),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  const fieldErrors = parsed.error.flatten().fieldErrors
  console.error('Variáveis de ambiente inválidas:', JSON.stringify(fieldErrors, null, 2))
  process.exit(1)
}

export const env = parsed.data
