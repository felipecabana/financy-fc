import { afterEach, describe, expect, it } from 'vitest'

import authService from '../src/services/auth.service.js'
import categoryService from '../src/services/category.service.js'
import {
  createEmailCleanup,
  signupData,
  TEST_PASSWORD,
  uniqueEmail,
} from './helpers/auth-test-utils.js'
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

    await categoryService.createCategory(userA, { name: 'Alimentação' })
    await categoryService.createCategory(userB, { name: 'Lazer' })

    const categories = await categoryService.listCategories(userA)
    expect(categories.map((c) => c.name)).toEqual(['Alimentação'])
  })

  it('getCategory retorna a própria e rejeita inexistente ou de outro usuário', async () => {
    const owner = await createUser('cat-owner')
    const other = await createUser('cat-other')

    const category = await categoryService.createCategory(owner, { name: 'Moradia' })
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

  it('createCategory valida nome e faz trim', async () => {
    const userId = await createUser('cat-create')

    const category = await categoryService.createCategory(userId, { name: '  Educação  ' })
    expect(category.name).toBe('Educação')

    await expectDomainError(
      categoryService.createCategory(userId, { name: '' }),
      DOMAIN_ERRORS.categoryNameRequired,
      DOMAIN_ERROR_CODES.UNAUTHORIZED,
    )
  })

  it('updateCategory atualiza a própria e rejeita erros', async () => {
    const owner = await createUser('cat-upd-owner')
    const other = await createUser('cat-upd-other')

    const category = await categoryService.createCategory(owner, { name: 'Viagem' })
    const updated = await categoryService.updateCategory(owner, category.id, { name: 'Férias' })

    expect(updated.name).toBe('Férias')

    await expectDomainError(
      categoryService.updateCategory(other, category.id, { name: 'X' }),
      DOMAIN_ERRORS.noPermission,
      DOMAIN_ERROR_CODES.FORBIDDEN,
    )
    await expectDomainError(
      categoryService.updateCategory(owner, category.id, { name: '   ' }),
      DOMAIN_ERRORS.categoryNameRequired,
      DOMAIN_ERROR_CODES.UNAUTHORIZED,
    )
  })

  it('deleteCategory remove a própria e rejeita erros', async () => {
    const owner = await createUser('cat-del-owner')
    const other = await createUser('cat-del-other')

    const category = await categoryService.createCategory(owner, { name: 'Pets' })

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
})
