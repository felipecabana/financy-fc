import { afterEach, describe, expect, it } from 'vitest'

import authResolvers from '../src/graphql/modules/auth/resolvers.js'
import {
  AUTH_ERRORS,
  createEmailCleanup,
  expectValidAuthPayload,
  TEST_PASSWORD,
  uniqueEmail,
} from './helpers/auth-test-utils.js'

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

    await expect(
      authResolvers.Mutation.signup(
        null,
        { data: { email, password: 'other-password' } },
        {},
        {} as never,
      ),
    ).rejects.toThrow(AUTH_ERRORS.duplicateEmail)
  })

  it('login propaga rejeição de credenciais inválidas', async () => {
    await expect(
      authResolvers.Mutation.login(
        null,
        { data: { email: 'missing@example.com', password: TEST_PASSWORD } },
        {},
        {} as never,
      ),
    ).rejects.toThrow(AUTH_ERRORS.invalidCredentials)
  })
})
