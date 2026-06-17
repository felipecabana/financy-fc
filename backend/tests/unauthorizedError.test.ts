import { describe, expect, it } from 'vitest'

import { UnauthorizedError } from '../src/errors/UnauthorizedError.js'

describe('UnauthorizedError', () => {
  it('expõe nome e mensagem estáveis', () => {
    const error = new UnauthorizedError()

    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(UnauthorizedError)
    expect(error.name).toBe('UnauthorizedError')
    expect(error.message).toBe('Usuário não autenticado.')
  })

  it('pode ser lançado e capturado pelo tipo exato', () => {
    expect(() => {
      throw new UnauthorizedError()
    }).toThrow(UnauthorizedError)
  })
})
