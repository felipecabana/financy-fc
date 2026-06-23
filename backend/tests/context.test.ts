import type { Request, Response } from 'express'
import { describe, expect, it } from 'vitest'

import { buildContext } from '../src/config/context/index.js'
import { AUTH_COOKIE_NAME } from '../src/helpers/auth-cookie.js'
import { createToken } from '../src/helpers/jwt.js'
import {
  DOMAIN_ERROR_CODES,
  DOMAIN_ERRORS,
  expectThrownDomainError,
} from './helpers/domain-error-assertions.js'

function mockRequest(authorization?: string, cookies?: Record<string, string>): Request {
  return {
    headers: authorization === undefined ? {} : { authorization },
    cookies: cookies ?? {},
  } as Request
}

describe('buildContext', () => {
  it('expõe res quando fornecido ao buildContext', async () => {
    const res = {} as Response
    const context = await buildContext({ req: mockRequest(), res })

    expect(context.res).toBe(res)
  })

  it('validate retorna o userId com token Bearer válido', async () => {
    const userId = 'user-abc'
    const token = createToken(userId)
    const context = await buildContext({
      req: mockRequest(`Bearer ${token}`),
    })

    expect(context.validate()).toBe(userId)
  })

  it('validate retorna o userId com cookie de sessão válido', async () => {
    const userId = 'user-cookie'
    const token = createToken(userId)
    const context = await buildContext({
      req: mockRequest(undefined, { [AUTH_COOKIE_NAME]: token }),
    })

    expect(context.validate()).toBe(userId)
  })

  it('validate prioriza Bearer quando header e cookie estão presentes', async () => {
    const bearerUserId = 'user-bearer'
    const cookieUserId = 'user-cookie'
    const context = await buildContext({
      req: mockRequest(`Bearer ${createToken(bearerUserId)}`, {
        [AUTH_COOKIE_NAME]: createToken(cookieUserId),
      }),
    })

    expect(context.validate()).toBe(bearerUserId)
  })

  it('validate lança UnauthorizedError sem header Authorization nem cookie', async () => {
    const context = await buildContext({ req: mockRequest() })

    expectThrownDomainError(
      () => context.validate(),
      DOMAIN_ERRORS.unauthenticated,
      DOMAIN_ERROR_CODES.UNAUTHORIZED,
    )
  })

  it('validate lança UnauthorizedError sem prefixo Bearer e sem cookie', async () => {
    const token = createToken('user-abc')
    const context = await buildContext({
      req: mockRequest(token),
    })

    expectThrownDomainError(
      () => context.validate(),
      DOMAIN_ERRORS.unauthenticated,
      DOMAIN_ERROR_CODES.UNAUTHORIZED,
    )
  })

  it('validate lança UnauthorizedError com token Bearer inválido', async () => {
    const context = await buildContext({
      req: mockRequest('Bearer invalid-token'),
    })

    expectThrownDomainError(
      () => context.validate(),
      DOMAIN_ERRORS.unauthenticated,
      DOMAIN_ERROR_CODES.UNAUTHORIZED,
    )
  })

  it('validate lança UnauthorizedError com cookie inválido', async () => {
    const context = await buildContext({
      req: mockRequest(undefined, { [AUTH_COOKIE_NAME]: 'invalid-token' }),
    })

    expectThrownDomainError(
      () => context.validate(),
      DOMAIN_ERRORS.unauthenticated,
      DOMAIN_ERROR_CODES.UNAUTHORIZED,
    )
  })
})
