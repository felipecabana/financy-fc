import { afterEach, describe, expect, it } from 'vitest'

import { prismaClient } from '../prisma/prisma.js'
import authService from '../src/services/auth.service.js'
import categoryService from '../src/services/category.service.js'
import {
  createEmailCleanup,
  signupData,
  uniqueEmail,
} from './helpers/auth-test-utils.js'
import { categoryInput } from './helpers/category-test-utils.js'
import {
  DOMAIN_ERROR_CODES,
  DOMAIN_ERRORS,
  expectDomainError,
} from './helpers/domain-error-assertions.js'

describe('category service', () => {
  const cleanup = createEmailCleanup()

  afterEach(async () => {
    await cleanup.reset()
  })

  async function createUser(prefix: string) {
    const email = uniqueEmail(prefix)
    cleanup.track(email)
    const { user } = await authService.signup(signupData(email))
    return user.id
  }

  it('lista só categorias do usuário', async () => {
    const userA = await createUser('cat-a')
    const userB = await createUser('cat-b')

    await categoryService.createCategory(userA, categoryInput({ name: 'Alimentação' }))
    await categoryService.createCategory(userB, categoryInput({ name: 'Lazer' }))

    const categories = await categoryService.listCategories(userA)
    expect(categories.map((c) => c.name)).toEqual(['Alimentação'])
  })

  it('getCategory retorna a própria e rejeita inexistente ou de outro usuário', async () => {
    const owner = await createUser('cat-owner')
    const other = await createUser('cat-other')

    const category = await categoryService.createCategory(owner, categoryInput({ name: 'Moradia' }))
    const found = await categoryService.getCategory(owner, category.id)

    expect(found.name).toBe('Moradia')

    await expectDomainError(
      categoryService.getCategory(other, category.id),
      DOMAIN_ERRORS.noPermission,
      DOMAIN_ERROR_CODES.FORBIDDEN,
    )
    await expectDomainError(
      categoryService.getCategory(owner, '00000000-0000-0000-0000-000000000000'),
      DOMAIN_ERRORS.categoryNotFound,
      DOMAIN_ERROR_CODES.NOT_FOUND,
    )
  })

  it('createCategory valida campos obrigatórios, whitelist e description', async () => {
    const userId = await createUser('cat-create')

    const category = await categoryService.createCategory(
      userId,
      categoryInput({
        name: '  Educação  ',
        description: '  Gastos com estudo  ',
        icon: 'book-open',
        color: 'blue',
      }),
    )

    expect(category.name).toBe('Educação')
    expect(category.description).toBe('Gastos com estudo')
    expect(category.icon).toBe('book-open')
    expect(category.color).toBe('blue')

    await expectDomainError(
      categoryService.createCategory(userId, categoryInput({ name: '' })),
      DOMAIN_ERRORS.categoryNameRequired,
      DOMAIN_ERROR_CODES.UNAUTHORIZED,
    )
    await expectDomainError(
      categoryService.createCategory(userId, categoryInput({ name: 'X', icon: '' })),
      DOMAIN_ERRORS.categoryIconRequired,
      DOMAIN_ERROR_CODES.UNAUTHORIZED,
    )
    await expectDomainError(
      categoryService.createCategory(userId, categoryInput({ name: 'X', color: '' })),
      DOMAIN_ERRORS.categoryColorRequired,
      DOMAIN_ERROR_CODES.UNAUTHORIZED,
    )
    await expectDomainError(
      categoryService.createCategory(userId, categoryInput({ name: 'X', icon: 'invalid-icon' })),
      DOMAIN_ERRORS.categoryIconInvalid,
      DOMAIN_ERROR_CODES.UNAUTHORIZED,
    )
    await expectDomainError(
      categoryService.createCategory(userId, categoryInput({ name: 'X', color: 'cyan' })),
      DOMAIN_ERRORS.categoryColorInvalid,
      DOMAIN_ERROR_CODES.UNAUTHORIZED,
    )
  })

  it('updateCategory atualiza a própria e rejeita erros', async () => {
    const owner = await createUser('cat-upd-owner')
    const other = await createUser('cat-upd-other')

    const category = await categoryService.createCategory(owner, categoryInput({ name: 'Viagem' }))
    const updated = await categoryService.updateCategory(
      owner,
      category.id,
      categoryInput({ name: 'Férias', icon: 'car-front', color: 'purple' }),
    )

    expect(updated.name).toBe('Férias')
    expect(updated.icon).toBe('car-front')
    expect(updated.color).toBe('purple')

    await expectDomainError(
      categoryService.updateCategory(other, category.id, categoryInput({ name: 'X' })),
      DOMAIN_ERRORS.noPermission,
      DOMAIN_ERROR_CODES.FORBIDDEN,
    )
    await expectDomainError(
      categoryService.updateCategory(owner, category.id, categoryInput({ name: '   ' })),
      DOMAIN_ERRORS.categoryNameRequired,
      DOMAIN_ERROR_CODES.UNAUTHORIZED,
    )
  })

  it('deleteCategory remove a própria e rejeita erros', async () => {
    const owner = await createUser('cat-del-owner')
    const other = await createUser('cat-del-other')

    const category = await categoryService.createCategory(owner, categoryInput({ name: 'Pets' }))

    await expectDomainError(
      categoryService.deleteCategory(other, category.id),
      DOMAIN_ERRORS.noPermission,
      DOMAIN_ERROR_CODES.FORBIDDEN,
    )

    expect(await categoryService.deleteCategory(owner, category.id)).toBe(true)
    await expectDomainError(
      categoryService.getCategory(owner, category.id),
      DOMAIN_ERRORS.categoryNotFound,
      DOMAIN_ERROR_CODES.NOT_FOUND,
    )
  })

  it('lista categoria legada sem ícone e cor', async () => {
    const userId = await createUser('cat-legacy')

    const legacy = await prismaClient.category.create({
      data: { name: 'Legada', userId },
    })

    const found = await categoryService.getCategory(userId, legacy.id)
    expect(found.icon).toBeNull()
    expect(found.color).toBeNull()
  })
})
