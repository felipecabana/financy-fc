import type { Request, Response } from 'express'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { buildContext } from '../src/config/context/index.js'
import authResolvers from '../src/graphql/modules/auth/resolvers.js'
import usersResolvers from '../src/graphql/modules/users/resolvers.js'
import { createEmailCleanup, signupData, TEST_NAME, TEST_PASSWORD, uniqueEmail } from './helpers/auth-test-utils.js'
import {
  DOMAIN_ERROR_CODES,
  DOMAIN_ERRORS,
  expectDomainError,
} from './helpers/domain-error-assertions.js'

function mockRequest(authorization?: string): Request {
  return {
    headers: authorization === undefined ? {} : { authorization },
  } as Request
}

describe('users me resolver', () => {
  const cleanup = createEmailCleanup()

  afterEach(async () => {
    await cleanup.reset()
  })

  it('retorna o usuário autenticado com token Bearer válido', async () => {
    const email = uniqueEmail('me')
    cleanup.track(email)

    const res = { cookie: vi.fn() } as unknown as Response
    const signup = await authResolvers.Mutation.signup(
      null,
      { data: signupData(email) },
      { res, validate: () => '' },
      {} as never,
    )

    const token = res.cookie.mock.calls[0]?.[1] as string
    expect(token).toEqual(expect.any(String))

    const context = await buildContext({
      req: mockRequest(`Bearer ${token}`),
    })

    const user = await usersResolvers.Query.me(null, {}, context, {} as never)

    expect(user).toEqual({
      id: signup.user.id,
      name: TEST_NAME,
      email,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    })
    expect(user).not.toHaveProperty('password')
  })

  it('lança UnauthorizedError sem token', async () => {
    const context = await buildContext({ req: mockRequest() })

    await expectDomainError(
      usersResolvers.Query.me(null, {}, context, {} as never),
      DOMAIN_ERRORS.unauthenticated,
      DOMAIN_ERROR_CODES.UNAUTHORIZED,
    )
  })
})
