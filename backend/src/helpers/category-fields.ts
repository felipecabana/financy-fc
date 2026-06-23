export const CATEGORY_COLORS = [
  'green',
  'blue',
  'purple',
  'pink',
  'red',
  'orange',
  'yellow',
] as const

export const CATEGORY_ICONS = [
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

export type CategoryColor = (typeof CATEGORY_COLORS)[number]
export type CategoryIcon = (typeof CATEGORY_ICONS)[number]

const colorSet = new Set<string>(CATEGORY_COLORS)
const iconSet = new Set<string>(CATEGORY_ICONS)

export function isCategoryColor(value: string): value is CategoryColor {
  return colorSet.has(value)
}

export function isCategoryIcon(value: string): value is CategoryIcon {
  return iconSet.has(value)
}
