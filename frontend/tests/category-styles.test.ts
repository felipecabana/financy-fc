import { describe, expect, it } from 'vitest'

import { resolveCategoryTagStyle } from '@/lib/category-styles'

describe('resolveCategoryTagStyle', () => {
  it('usa a cor da categoria quando informada', () => {
    expect(resolveCategoryTagStyle('blue').bg).toBe('bg-blue-light')
    expect(resolveCategoryTagStyle('green').bg).toBe('bg-green-light')
    expect(resolveCategoryTagStyle('orange').bg).toBe('bg-orange-light')
  })

  it('usa fallback por indice quando a cor nao existe', () => {
    expect(resolveCategoryTagStyle(null, 0).bg).toBe('bg-blue-light')
    expect(resolveCategoryTagStyle(null, 3).bg).toBe('bg-pink-light')
  })
})
