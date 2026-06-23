export type CategoryTagStyle = {
  bg: string
  text: string
  icon: string
}

export const incomeTagStyle: CategoryTagStyle = {
  bg: 'bg-green-light',
  text: 'text-green-dark',
  icon: 'bg-green-light text-green-dark',
}

const fallbackVariants: CategoryTagStyle[] = [
  { bg: 'bg-blue-light', text: 'text-blue-dark', icon: 'bg-blue-light text-blue-dark' },
  { bg: 'bg-purple-light', text: 'text-purple-dark', icon: 'bg-purple-light text-purple-dark' },
  { bg: 'bg-orange-light', text: 'text-orange-dark', icon: 'bg-orange-light text-orange-dark' },
  { bg: 'bg-pink-light', text: 'text-pink-dark', icon: 'bg-pink-light text-pink-dark' },
  { bg: 'bg-yellow-light', text: 'text-yellow-dark', icon: 'bg-yellow-light text-yellow-dark' },
  { bg: 'bg-green-light', text: 'text-green-dark', icon: 'bg-green-light text-green-dark' },
]

export const categoryColorStyles: Record<string, CategoryTagStyle> = {
  green: fallbackVariants[5]!,
  blue: fallbackVariants[0]!,
  purple: fallbackVariants[1]!,
  orange: fallbackVariants[2]!,
  pink: fallbackVariants[3]!,
  yellow: fallbackVariants[4]!,
  red: { bg: 'bg-red-light', text: 'text-red-dark', icon: 'bg-red-light text-red-dark' },
}

export function resolveCategoryTagStyle(
  color?: string | null,
  fallbackIndex = 0,
): CategoryTagStyle {
  if (color && categoryColorStyles[color]) {
    return categoryColorStyles[color]
  }

  return fallbackVariants[fallbackIndex % fallbackVariants.length]!
}
