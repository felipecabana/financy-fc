import { z } from 'zod'

export const transactionSchema = z.object({
  title: z.string().trim().min(1, 'Preencha a descrição.'),
  date: z.string().min(1, 'Selecione a data.'),
  amount: z.coerce
    .number({ error: 'Informe um valor válido.' })
    .refine((value) => !Number.isNaN(value), 'Informe um valor válido.')
    .refine((value) => value > 0, 'Informe um valor maior que zero.'),
  type: z.enum(['receita', 'despesa'], { error: 'Selecione o tipo da transação.' }),
  categoryId: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || undefined),
})

export type TransactionFormValues = z.infer<typeof transactionSchema>
