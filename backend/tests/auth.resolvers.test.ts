import { afterEach, describe, expect, it } from 'vitest'

import authResolvers from '../src/graphql/modules/auth/resolvers.js'
import {
  createEmailCleanup,
  expectValidAuthPayload,
  TEST_PASSWORD,
  uniqueEmail,
} from './helpers/auth-test-utils.js'
import {
  DOMAIN_ERROR_CODES,
  DOMAIN_ERRORS,
  expectDomainError,
} from './helpers/domain-error-assertions.js'

describe('auth resolvers', () => {
  const cleanup = createEmailCleanup()

  afterEach(async () => {
    await cleanup.reset()
  })

  it('signup retorna AuthPayload com token e usuário público', async () => {
    const email = uniqueEmail('resolver')
    cleanup.track(email)

    const result = await authResolvers.Mutation.signup(
      null,
      { data: { email, password: TEST_PASSWORD } },
      {},
      {} as never,
    )

    expect(result).toEqual({
      token: expect.any(String),
      user: {
        id: expect.any(String),
        email,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      },
    })
    expectValidAuthPayload(result, email)
  })

  it('login retorna AuthPayload com token e usuário público', async () => {
    const email = uniqueEmail('resolver')
    cleanup.track(email)

    await authResolvers.Mutation.signup(
      null,
      { data: { email, password: TEST_PASSWORD } },
      {},
      {} as never,
    )

    const result = await authResolvers.Mutation.login(
      null,
      { data: { email, password: TEST_PASSWORD } },
      {},
      {} as never,
    )

    expectValidAuthPayload(result, email)
  })

  it('signup propaga rejeição de email duplicado', async () => {
    const email = uniqueEmail('resolver')
    cleanup.track(email)

    await authResolvers.Mutation.signup(
      null,
      { data: { email, password: TEST_PASSWORD } },
      {},
      {} as never,
    )

    await expectDomainError(
      authResolvers.Mutation.signup(
        null,
        { data: { email, password: 'other-password' } },
        {},
        {} as never,
      ),
      DOMAIN_ERRORS.duplicateEmail,
      DOMAIN_ERROR_CODES.FORBIDDEN,
    )
  })

  it('login propaga rejeição de credenciais inválidas', async () => {
    await expectDomainError(
      authResolvers.Mutation.login(
        null,
        { data: { email: 'missing@example.com', password: TEST_PASSWORD } },
        {},
        {} as never,
      ),
      DOMAIN_ERRORS.invalidCredentials,
      DOMAIN_ERROR_CODES.UNAUTHORIZED,
    )
  })
})
