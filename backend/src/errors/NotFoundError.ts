import { AppGraphQLError } from './AppGraphQLError.js'

export class NotFoundError extends AppGraphQLError {
  constructor(entity = 'Recurso') {
    super(`${entity} não encontrado.`, 'NOT_FOUND', 'NotFoundError')
  }
}
