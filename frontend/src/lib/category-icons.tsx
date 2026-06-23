import {
  BaggageClaim,
  BookOpen,
  BriefcaseBusiness,
  CarFront,
  Dumbbell,
  Gift,
  HeartPulse,
  House,
  Mailbox,
  PawPrint,
  PiggyBank,
  ReceiptText,
  ShoppingCart,
  Tag,
  Ticket,
  ToolCase,
  Utensils,
  type LucideIcon,
} from 'lucide-react'

import { categoryIcons } from '@/pages/Dashboard/category-schema'

export const categoryIconComponents: Record<string, LucideIcon> = {
  'briefcase-business': BriefcaseBusiness,
  'car-front': CarFront,
  'heart-pulse': HeartPulse,
  'piggy-bank': PiggyBank,
  'shopping-cart': ShoppingCart,
  ticket: Ticket,
  'tool-case': ToolCase,
  utensils: Utensils,
  'paw-print': PawPrint,
  house: House,
  gift: Gift,
  dumbbell: Dumbbell,
  'book-open': BookOpen,
  'baggage-claim': BaggageClaim,
  mailbox: Mailbox,
  'receipt-text': ReceiptText,
}

export const categoryIconOptions = categoryIcons.map((id) => ({
  id,
  Icon: categoryIconComponents[id]!,
}))

type CategoryIconProps = {
  icon?: string | null
  className?: string
}

export function CategoryIcon({ icon, className }: CategoryIconProps) {
  const Icon = icon ? categoryIconComponents[icon] : undefined

  if (Icon) {
    return <Icon className={className} />
  }

  return <Tag className={className} />
}
