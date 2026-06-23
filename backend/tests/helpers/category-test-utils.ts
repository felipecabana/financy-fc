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
