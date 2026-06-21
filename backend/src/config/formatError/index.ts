import { unwrapResolverError } from '@apollo/server/errors'
import { GraphQLError, type GraphQLFormattedError } from 'graphql'

import { NoPermissionError } from '../../errors/NoPermissionError.js'
import { NotFoundError } from '../../errors/NotFoundError.js'
import { UnauthorizedError } from '../../errors/UnauthorizedError.js'

type DomainError = UnauthorizedError | NoPermissionError | NotFoundError
type KnownErrorCode = 'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND'

const resolveDomainError = (error: unknown): DomainError | undefined => {
  const candidate = unwrapResolverError(error)

  if (
    candidate instanceof UnauthorizedError ||
    candidate instanceof NoPermissionError ||
    candidate instanceof NotFoundError
  ) {
    return candidate
  }

  if (candidate instanceof GraphQLError && candidate.originalError) {
    return resolveDomainError(candidate.originalError)
  }

  return undefined
}

const isKnownErrorCode = (code: unknown): code is KnownErrorCode =>
  code === 'UNAUTHORIZED' || code === 'FORBIDDEN' || code === 'NOT_FOUND'

export const formatError = (
  formattedError: GraphQLFormattedError,
  error: unknown,
): GraphQLFormattedError => {
  const domainError = resolveDomainError(error)

  if (domainError instanceof UnauthorizedError) {
    return { ...formattedError, message: domainError.message, extensions: { code: 'UNAUTHORIZED' } }
  }

  if (domainError instanceof NoPermissionError) {
    return { ...formattedError, message: domainError.message, extensions: { code: 'FORBIDDEN' } }
  }

  if (domainError instanceof NotFoundError) {
    return { ...formattedError, message: domainError.message, extensions: { code: 'NOT_FOUND' } }
  }

  const enrichedCode = formattedError.extensions?.code
  if (isKnownErrorCode(enrichedCode)) {
    return { ...formattedError, extensions: { code: enrichedCode } }
  }

  return { ...formattedError, message: 'Erro interno.', extensions: { code: 'INTERNAL_SERVER_ERROR' } }
}
