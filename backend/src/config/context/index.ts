import type { Request, Response } from 'express'

import { UnauthorizedError } from '../../errors/UnauthorizedError.js'
import { AUTH_COOKIE_NAME } from '../../helpers/auth-cookie.js'
import { verifyToken } from '../../helpers/jwt.js'

export interface GraphqlContext {
  res?: Response
  validate: () => string
}

function resolveUserId(req: Request): string {
  const authorization = req.headers.authorization

  if (authorization?.startsWith('Bearer ')) {
    const token = authorization.slice('Bearer '.length)
    if (!token) throw new UnauthorizedError()

    try {
      return verifyToken(token).id
    } catch {
      throw new UnauthorizedError()
    }
  }

  const cookieToken = req.cookies?.[AUTH_COOKIE_NAME]
  if (!cookieToken) throw new UnauthorizedError()

  try {
    return verifyToken(cookieToken).id
  } catch {
    throw new UnauthorizedError()
  }
}

export const buildContext = async ({
  req,
  res,
}: {
  req: Request
  res?: Response
}): Promise<GraphqlContext> => ({
  res,
  validate: () => resolveUserId(req),
})
