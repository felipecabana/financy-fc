import { GraphQLError } from 'graphql'
import { describe, expect, it } from 'vitest'

import { formatError } from '../src/config/formatError/index.js'
import { NoPermissionError } from '../src/errors/NoPermissionError.js'
import { NotFoundError } from '../src/errors/NotFoundError.js'
import { UnauthorizedError } from '../src/errors/UnauthorizedError.js'

const formattedBase = {
  message: 'mensagem original',
  extensions: { stacktrace: ['at src/sensitive.ts:10'] },
}

describe('formatError', () => {
  it('normaliza UnauthorizedError lançado diretamente', () => {
    const result = formatError(formattedBase, new UnauthorizedError())

    expect(result.message).toBe('Usuário não autenticado.')
    expect(result.extensions?.code).toBe('UNAUTHORIZED')
  })

  it('normaliza NoPermissionError lançado diretamente', () => {
    const result = formatError(formattedBase, new NoPermissionError())

    expect(result.message).toBe('Sem permissão para realizar esta ação.')
    expect(result.extensions?.code).toBe('FORBIDDEN')
  })

  it('normaliza NotFoundError lançado diretamente', () => {
    const result = formatError(formattedBase, new NotFoundError('Categoria'))

    expect(result.message).toBe('Categoria não encontrado.')
    expect(result.extensions?.code).toBe('NOT_FOUND')
  })

  it('resolve erro de domínio encapsulado em GraphQLError', () => {
    const domainError = new UnauthorizedError()
    const wrapped = new GraphQLError('falha', { originalError: domainError })

    const result = formatError(formattedBase, wrapped)

    expect(result.message).toBe('Usuário não autenticado.')
    expect(result.extensions?.code).toBe('UNAUTHORIZED')
  })

  it('preserva código enriquecido quando instanceof falha', () => {
    const enriched = {
      message: 'Credenciais inválidas.',
      extensions: { code: 'UNAUTHORIZED' as const },
    }
    const wrapped = new GraphQLError('Credenciais inválidas.', { extensions: { code: 'UNAUTHORIZED' } })

    const result = formatError(enriched, wrapped)

    expect(result.message).toBe('Credenciais inválidas.')
    expect(result.extensions?.code).toBe('UNAUTHORIZED')
  })

  it('oculta detalhes internos de erro inesperado', () => {
    const internal = new Error('SQLITE_CONSTRAINT: detalhe sensível do banco')
    const wrapped = new GraphQLError('falha interna', { originalError: internal })

    const result = formatError(formattedBase, wrapped)

    expect(result.message).toBe('Erro interno.')
    expect(result.extensions?.code).toBe('INTERNAL_SERVER_ERROR')
    expect(result.extensions?.stacktrace).toBeUndefined()
    expect(JSON.stringify(result)).not.toContain('SQLITE')
    expect(JSON.stringify(result)).not.toContain('sensitive.ts')
  })
})
