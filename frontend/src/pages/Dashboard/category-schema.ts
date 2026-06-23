import { z } from 'zod'

export const categorySchema = z.object({
  name: z.string().trim().min(1, 'Preencha o nome.'),
})

export type CategoryFormValues = z.infer<typeof categorySchema>
