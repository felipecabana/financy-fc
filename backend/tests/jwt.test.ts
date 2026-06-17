import jwt from 'jsonwebtoken'
import { describe, expect, it } from 'vitest'

import { createToken, verifyToken } from '../src/helpers/jwt.js'

describe('jwt helpers', () => {
  it('createToken e verifyToken retornam o id do usuário em um ciclo válido', () => {
    const userId = 'user-123'
    const token = createToken(userId)

    expect(verifyToken(token).id).toBe(userId)
  })

  it('verifyToken rejeita um token malformado', () => {
    expect(() => verifyToken('not-a-valid-jwt')).toThrow()
  })

  it('verifyToken rejeita um token assinado com secret diferente', () => {
    const token = jwt.sign({ id: 'user-123' }, 'wrong-secret', { expiresIn: '1d' })

    expect(() => verifyToken(token)).toThrow()
  })
})
