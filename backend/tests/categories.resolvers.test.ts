import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { GraphqlContext } from '../src/config/context/index.js'
import { UnauthorizedError } from '../src/errors/UnauthorizedError.js'
import categoriesResolvers from '../src/graphql/modules/categories/resolvers.js'
import categoryService from '../src/services/category.service.js'

const userId = 'user-123'
const categoryId = 'category-456'

const sampleCategory = {
  id: categoryId,
  name: 'Alimentação',
  userId,
  createdAt: new Date('2026-01-01T12:00:00.000Z'),
  updatedAt: new Date('2026-01-02T12:00:00.000Z'),
}

describe('categories resolvers', () => {
  const context: GraphqlContext = {
    validate: vi.fn(() => userId),
  }

  beforeEach(() => {
    vi.restoreAllMocks()
    vi.mocked(context.validate).mockReturnValue(userId)
  })

  it('Query delega ao service com userId do context', async () => {
    const listSpy = vi.spyOn(categoryService, 'listCategories').mockResolvedValue([sampleCategory])
    const getSpy = vi.spyOn(categoryService, 'getCategory').mockResolvedValue(sampleCategory)

    await categoriesResolvers.Query.listCategories(null, {}, context, {} as never)
    await categoriesResolvers.Query.getCategory(null, { id: categoryId }, context, {} as never)

    expect(context.validate).toHaveBeenCalled()
    expect(listSpy).toHaveBeenCalledWith(userId)
    expect(getSpy).toHaveBeenCalledWith(userId, categoryId)
  })

  it('Mutation delega ao service com userId do context', async () => {
    const createSpy = vi.spyOn(categoryService, 'createCategory').mockResolvedValue(sampleCategory)
    const updateSpy = vi.spyOn(categoryService, 'updateCategory').mockResolvedValue(sampleCategory)
    const deleteSpy = vi.spyOn(categoryService, 'deleteCategory').mockResolvedValue(true)

    await categoriesResolvers.Mutation.createCategory(
      null,
      { data: { name: 'Transporte' } },
      context,
      {} as never,
    )
    await categoriesResolvers.Mutation.updateCategory(
      null,
      { id: categoryId, data: { name: 'Moradia' } },
      context,
      {} as never,
    )
    await categoriesResolvers.Mutation.deleteCategory(
      null,
      { id: categoryId },
      context,
      {} as never,
    )

    expect(createSpy).toHaveBeenCalledWith(userId, { name: 'Transporte' })
    expect(updateSpy).toHaveBeenCalledWith(userId, categoryId, { name: 'Moradia' })
    expect(deleteSpy).toHaveBeenCalledWith(userId, categoryId)
  })

  it('propaga erro do service e não chama service sem auth', async () => {
    vi.spyOn(categoryService, 'getCategory').mockRejectedValue(
      new Error('Categoria não encontrada.'),
    )

    await expect(
      categoriesResolvers.Query.getCategory(null, { id: categoryId }, context, {} as never),
    ).rejects.toThrow('Categoria não encontrada.')

    const unauthorizedContext: GraphqlContext = {
      validate: () => {
        throw new UnauthorizedError()
      },
    }
    const listSpy = vi.spyOn(categoryService, 'listCategories')

    await expect(
      categoriesResolvers.Query.listCategories(null, {}, unauthorizedContext, {} as never),
    ).rejects.toThrow(UnauthorizedError)
    expect(listSpy).not.toHaveBeenCalled()
  })

  it('Category formata datas em ISO', () => {
    expect(categoriesResolvers.Category.createdAt(sampleCategory)).toBe('2026-01-01T12:00:00.000Z')
    expect(categoriesResolvers.Category.updatedAt(sampleCategory)).toBe('2026-01-02T12:00:00.000Z')
  })
})
