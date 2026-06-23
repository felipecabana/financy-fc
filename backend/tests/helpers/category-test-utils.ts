import { DEFAULT_CATEGORIES } from '../../src/helpers/default-categories.js'

export function categoryInput(fields: {
  name: string
  icon?: string
  color?: string
  description?: string | null
}) {
  return {
    icon: 'utensils',
    color: 'green',
    ...fields,
  }
}

export { DEFAULT_CATEGORIES }

export const DEFAULT_CATEGORY_COUNT = DEFAULT_CATEGORIES.length
