import type { Request } from 'express'
import { afterEach, describe, expect, it } from 'vitest'

import { buildContext } from '../src/config/context/index.js'
import { UnauthorizedError } from '../src/errors/UnauthorizedError.js'
import authResolvers from '../src/graphql/modules/auth/resolvers.js'
import usersResolvers from '../src/graphql/modules/users/resolvers.js'
import { createEmailCleanup, TEST_PASSWORD, uniqueEmail } from './helpers/auth-test-utils.js'

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

    const signup = await authResolvers.Mutation.signup(
      null,
      { data: { email, password: TEST_PASSWORD } },
      {},
      {} as never,
    )

    const context = await buildContext({
      req: mockRequest(`Bearer ${signup.token}`),
    })

    const user = await usersResolvers.Query.me(null, {}, context, {} as never)

    expect(user).toEqual({
      id: signup.user.id,
      email,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    })
    expect(user).not.toHaveProperty('password')
  })

  it('lança UnauthorizedError sem token', async () => {
    const context = await buildContext({ req: mockRequest() })

    await expect(
      usersResolvers.Query.me(null, {}, context, {} as never),
    ).rejects.toThrow(UnauthorizedError)
  })
})
