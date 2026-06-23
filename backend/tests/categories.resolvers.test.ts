import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { GraphqlContext } from '../src/config/context/index.js'
import { NotFoundError } from '../src/errors/NotFoundError.js'
import { UnauthorizedError } from '../src/errors/UnauthorizedError.js'
import categoriesResolvers from '../src/graphql/modules/categories/resolvers.js'
import categoryService from '../src/services/category.service.js'
import { categoryInput } from './helpers/category-test-utils.js'
import {
  DOMAIN_ERROR_CODES,
  DOMAIN_ERRORS,
  expectDomainError,
} from './helpers/domain-error-assertions.js'

const userId = 'user-123'
const categoryId = 'category-456'

const sampleCategory = {
  id: categoryId,
  name: 'Alimentação',
  description: 'Mercado',
  icon: 'utensils',
  color: 'green',
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

    const createData = categoryInput({ name: 'Transporte', icon: 'car-front', color: 'blue' })
    const updateData = categoryInput({ name: 'Moradia', icon: 'house', color: 'purple' })

    await categoriesResolvers.Mutation.createCategory(
      null,
      { data: createData },
      context,
      {} as never,
    )
    await categoriesResolvers.Mutation.updateCategory(
      null,
      { id: categoryId, data: updateData },
      context,
      {} as never,
    )
    await categoriesResolvers.Mutation.deleteCategory(
      null,
      { id: categoryId },
      context,
      {} as never,
    )

    expect(createSpy).toHaveBeenCalledWith(userId, createData)
    expect(updateSpy).toHaveBeenCalledWith(userId, categoryId, updateData)
    expect(deleteSpy).toHaveBeenCalledWith(userId, categoryId)
  })

  it('propaga erro do service e não chama service sem auth', async () => {
    vi.spyOn(categoryService, 'getCategory').mockRejectedValue(
      new NotFoundError('Categoria'),
    )

    await expectDomainError(
      categoriesResolvers.Query.getCategory(null, { id: categoryId }, context, {} as never),
      DOMAIN_ERRORS.categoryNotFound,
      DOMAIN_ERROR_CODES.NOT_FOUND,
    )

    const unauthorizedContext: GraphqlContext = {
      validate: () => {
        throw new UnauthorizedError()
      },
    }
    const listSpy = vi.spyOn(categoryService, 'listCategories')

    await expectDomainError(
      categoriesResolvers.Query.listCategories(null, {}, unauthorizedContext, {} as never),
      DOMAIN_ERRORS.unauthenticated,
      DOMAIN_ERROR_CODES.UNAUTHORIZED,
    )
    expect(listSpy).not.toHaveBeenCalled()
  })

  it('Category formata datas em ISO', () => {
    expect(categoriesResolvers.Category.createdAt(sampleCategory)).toBe('2026-01-01T12:00:00.000Z')
    expect(categoriesResolvers.Category.updatedAt(sampleCategory)).toBe('2026-01-02T12:00:00.000Z')
  })
})
