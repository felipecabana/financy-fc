import { z } from 'zod'

export const categoryIcons = [
  'briefcase-business',
  'car-front',
  'heart-pulse',
  'piggy-bank',
  'shopping-cart',
  'ticket',
  'tool-case',
  'utensils',
  'paw-print',
  'house',
  'gift',
  'dumbbell',
  'book-open',
  'baggage-claim',
  'mailbox',
  'receipt-text',
] as const

export const categoryColors = [
  'green',
  'blue',
  'purple',
  'pink',
  'red',
  'orange',
  'yellow',
] as const

export const categorySchema = z.object({
  name: z.string().trim().min(1, 'Preencha o nome.'),
  icon: z.enum(categoryIcons, { error: 'Selecione um ícone.' }),
  color: z.enum(categoryColors, { error: 'Selecione uma cor.' }),
  description: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || undefined),
})

export type CategoryFormValues = z.infer<typeof categorySchema>
