import jwt from 'jsonwebtoken'

import { env } from '../config/env/index.js'

export const createToken = (id: string): string =>
  jwt.sign({ id }, env.JWT_SECRET, { expiresIn: '1d' })

export const verifyToken = (token: string): { id: string } =>
  jwt.verify(token, env.JWT_SECRET) as { id: string }
