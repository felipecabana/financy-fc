import { expect } from 'vitest'

import { AUTH_ERRORS } from './auth-test-utils.js'

export const DOMAIN_ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
} as const

export const DOMAIN_ERRORS = {
  ...AUTH_ERRORS,
  noPermission: 'Sem permissão para realizar esta ação.',
  categoryNotFound: 'Categoria não encontrado.',
  transactionNotFound: 'Transação não encontrado.',
  userNotFound: 'Usuário não encontrado.',
  categoryNameRequired: 'Nome é obrigatório.',
  categoryIconRequired: 'Ícone é obrigatório.',
  categoryColorRequired: 'Cor é obrigatória.',
  categoryIconInvalid: 'Ícone inválido.',
  categoryColorInvalid: 'Cor inválida.',
  titleRequired: 'Título é obrigatório.',
  amountRequired: 'Valor é obrigatório.',
  typeRequired: 'Tipo é obrigatório.',
  unauthenticated: 'Usuário não autenticado.',
} as const

type DomainErrorCode = (typeof DOMAIN_ERROR_CODES)[keyof typeof DOMAIN_ERROR_CODES]

export function expectDomainError(
  promise: Promise<unknown>,
  message: string,
  code: DomainErrorCode,
) {
  return expect(promise).rejects.toMatchObject({
    message,
    extensions: { code },
  })
}

export function expectGraphqlError(
  error: { message?: string; extensions?: { code?: string } } | undefined,
  message: string,
  code: DomainErrorCode,
) {
  expect(error).toMatchObject({
    message,
    extensions: { code },
  })
}

export function expectThrownDomainError(
  fn: () => unknown,
  message: string,
  code: DomainErrorCode,
) {
  expect(fn).toThrow(
    expect.objectContaining({
      message,
      extensions: { code },
    }),
  )
}
