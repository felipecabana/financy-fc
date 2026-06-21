import { describe, expect, it } from 'vitest'

import { NoPermissionError } from '../src/errors/NoPermissionError.js'
import { NotFoundError } from '../src/errors/NotFoundError.js'
import { UnauthorizedError } from '../src/errors/UnauthorizedError.js'
import {
  DOMAIN_ERROR_CODES,
  DOMAIN_ERRORS,
} from './helpers/domain-error-assertions.js'

describe('domain errors', () => {
  it('UnauthorizedError expõe mensagem, nome e código estáveis', () => {
    const error = new UnauthorizedError()

    expect(error).toBeInstanceOf(UnauthorizedError)
    expect(error.name).toBe('UnauthorizedError')
    expect(error.message).toBe(DOMAIN_ERRORS.unauthenticated)
    expect(error.extensions.code).toBe(DOMAIN_ERROR_CODES.UNAUTHORIZED)
  })

  it('UnauthorizedError aceita mensagem customizada', () => {
    const error = new UnauthorizedError('Credenciais inválidas.')

    expect(error.message).toBe('Credenciais inválidas.')
    expect(error.extensions.code).toBe(DOMAIN_ERROR_CODES.UNAUTHORIZED)
  })

  it('NoPermissionError expõe mensagem, nome e código estáveis', () => {
    const error = new NoPermissionError()

    expect(error).toBeInstanceOf(NoPermissionError)
    expect(error.name).toBe('NoPermissionError')
    expect(error.message).toBe(DOMAIN_ERRORS.noPermission)
    expect(error.extensions.code).toBe(DOMAIN_ERROR_CODES.FORBIDDEN)
  })

  it('NotFoundError usa mensagem padrão', () => {
    const error = new NotFoundError()

    expect(error).toBeInstanceOf(NotFoundError)
    expect(error.name).toBe('NotFoundError')
    expect(error.message).toBe('Recurso não encontrado.')
    expect(error.extensions.code).toBe(DOMAIN_ERROR_CODES.NOT_FOUND)
  })

  it('NotFoundError aceita entidade customizada', () => {
    const error = new NotFoundError('Categoria')

    expect(error.message).toBe(DOMAIN_ERRORS.categoryNotFound)
    expect(error.extensions.code).toBe(DOMAIN_ERROR_CODES.NOT_FOUND)
  })
})
