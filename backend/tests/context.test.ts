import type { Request } from 'express'
import { describe, expect, it } from 'vitest'

import { buildContext } from '../src/config/context/index.js'
import { UnauthorizedError } from '../src/errors/UnauthorizedError.js'
import { createToken } from '../src/helpers/jwt.js'

function mockRequest(authorization?: string): Request {
  return {
    headers: authorization === undefined ? {} : { authorization },
  } as Request
}

describe('buildContext', () => {
  it('validate retorna o userId com token Bearer válido', async () => {
    const userId = 'user-abc'
    const token = createToken(userId)
    const context = await buildContext({
      req: mockRequest(`Bearer ${token}`),
    })

    expect(context.validate()).toBe(userId)
  })

  it('validate lança UnauthorizedError sem header Authorization', async () => {
    const context = await buildContext({ req: mockRequest() })

    expect(() => context.validate()).toThrow(UnauthorizedError)
  })

  it('validate lança UnauthorizedError sem prefixo Bearer', async () => {
    const token = createToken('user-abc')
    const context = await buildContext({
      req: mockRequest(token),
    })

    expect(() => context.validate()).toThrow(UnauthorizedError)
  })

  it('validate lança UnauthorizedError com token inválido', async () => {
    const context = await buildContext({
      req: mockRequest('Bearer invalid-token'),
    })

    expect(() => context.validate()).toThrow(UnauthorizedError)
  })
})
