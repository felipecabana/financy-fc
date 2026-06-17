import type { Request } from 'express'

import { UnauthorizedError } from '../../errors/UnauthorizedError.js'
import { verifyToken } from '../../helpers/jwt.js'

export interface GraphqlContext {
  validate: () => string
}

export const buildContext = async ({ req }: { req: Request }): Promise<GraphqlContext> => ({
  validate: () => {
    const authorization = req.headers.authorization

    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedError()
    }

    const token = authorization.slice('Bearer '.length)

    if (!token) {
      throw new UnauthorizedError()
    }

    try {
      const { id } = verifyToken(token)
      return id
    } catch {
      throw new UnauthorizedError()
    }
  },
})
