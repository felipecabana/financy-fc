import type { Response } from 'express'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { GraphqlContext } from '../src/config/context/index.js'
import { AUTH_COOKIE_NAME, getAuthCookieOptions } from '../src/helpers/auth-cookie.js'
import authResolvers from '../src/graphql/modules/auth/resolvers.js'
import {
  createEmailCleanup,
  expectValidAuthPayload,
  signupData,
  TEST_PASSWORD,
  uniqueEmail,
} from './helpers/auth-test-utils.js'
import {
  DOMAIN_ERROR_CODES,
  DOMAIN_ERRORS,
  expectDomainError,
} from './helpers/domain-error-assertions.js'

function createAuthContext() {
  const res = {
    cookie: vi.fn(),
    clearCookie: vi.fn(),
  } as unknown as Response
  const context: GraphqlContext = { res, validate: () => '' }
  return { context, res }
}

describe('auth resolvers', () => {
  const cleanup = createEmailCleanup()

  afterEach(async () => {
    await cleanup.reset()
  })

  it('signup retorna usuário público e seta cookie de sessão', async () => {
    const email = uniqueEmail('resolver')
    cleanup.track(email)
    const { context, res } = createAuthContext()

    const result = await authResolvers.Mutation.signup(
      null,
      { data: signupData(email) },
      context,
      {} as never,
    )

    expect(result.user).toMatchObject({
      id: expect.any(String),
      email,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    })
    expect(result).not.toHaveProperty('token')
    expectValidAuthPayload(result, email)
    expect(res.cookie).toHaveBeenCalledWith(
      AUTH_COOKIE_NAME,
      expect.any(String),
      expect.objectContaining({ httpOnly: true }),
    )
  })

  it('login retorna usuário público e seta cookie de sessão', async () => {
    const email = uniqueEmail('resolver')
    cleanup.track(email)
    const signupContext = createAuthContext()

    await authResolvers.Mutation.signup(
      null,
      { data: signupData(email) },
      signupContext.context,
      {} as never,
    )

    const { context, res } = createAuthContext()
    const result = await authResolvers.Mutation.login(
      null,
      { data: { email, password: TEST_PASSWORD } },
      context,
      {} as never,
    )

    expectValidAuthPayload(result, email)
    expect(res.cookie).toHaveBeenCalledWith(
      AUTH_COOKIE_NAME,
      expect.any(String),
      expect.objectContaining({ httpOnly: true }),
    )
  })

  it('signup propaga rejeição de email duplicado sem setar cookie', async () => {
    const email = uniqueEmail('resolver')
    cleanup.track(email)
    const firstContext = createAuthContext()

    await authResolvers.Mutation.signup(
      null,
      { data: signupData(email) },
      firstContext.context,
      {} as never,
    )

    const { context, res } = createAuthContext()

    await expectDomainError(
      authResolvers.Mutation.signup(
        null,
        { data: signupData(email, 'other-password') },
        context,
        {} as never,
      ),
      DOMAIN_ERRORS.duplicateEmail,
      DOMAIN_ERROR_CODES.FORBIDDEN,
    )

    expect(res.cookie).not.toHaveBeenCalled()
  })

  it('login propaga rejeição de credenciais inválidas sem setar cookie', async () => {
    const { context, res } = createAuthContext()

    await expectDomainError(
      authResolvers.Mutation.login(
        null,
        { data: { email: 'missing@example.com', password: TEST_PASSWORD } },
        context,
        {} as never,
      ),
      DOMAIN_ERRORS.invalidCredentials,
      DOMAIN_ERROR_CODES.UNAUTHORIZED,
    )

    expect(res.cookie).not.toHaveBeenCalled()
  })

  it('logout limpa cookie de sessão', async () => {
    const { context, res } = createAuthContext()

    const result = await authResolvers.Mutation.logout(null, {}, context, {} as never)

    expect(result).toBe(true)
    expect(res.clearCookie).toHaveBeenCalledWith(AUTH_COOKIE_NAME, getAuthCookieOptions())
  })
})
