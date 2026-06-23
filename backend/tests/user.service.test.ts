import { afterEach, describe, expect, it } from 'vitest'

import authService from '../src/services/auth.service.js'
import userService from '../src/services/user.service.js'
import {
  createEmailCleanup,
  signupData,
  TEST_NAME,
  uniqueEmail,
} from './helpers/auth-test-utils.js'
import {
  DOMAIN_ERROR_CODES,
  DOMAIN_ERRORS,
  expectDomainError,
} from './helpers/domain-error-assertions.js'

describe('user service', () => {
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

  it('getUser retorna usuário existente', async () => {
    const userId = await createUser('user-get')

    const user = await userService.getUser(userId)

    expect(user.name).toBe(TEST_NAME)
    expect(user.email).toContain('user-get')
  })

  it('getUser lança NotFoundError para id inexistente', async () => {
    await expectDomainError(
      userService.getUser('00000000-0000-0000-0000-000000000000'),
      DOMAIN_ERRORS.userNotFound,
      DOMAIN_ERROR_CODES.NOT_FOUND,
    )
  })

  it('updateUser atualiza o nome', async () => {
    const userId = await createUser('user-upd')

    const updated = await userService.updateUser(userId, { name: 'Novo Nome' })

    expect(updated.name).toBe('Novo Nome')
    expect((await userService.getUser(userId)).name).toBe('Novo Nome')
  })

  it('updateUser rejeita nome vazio', async () => {
    const userId = await createUser('user-empty')

    await expectDomainError(
      userService.updateUser(userId, { name: '   ' }),
      DOMAIN_ERRORS.categoryNameRequired,
      DOMAIN_ERROR_CODES.UNAUTHORIZED,
    )
  })
})
