import { AppGraphQLError } from './AppGraphQLError.js'

export class UnauthorizedError extends AppGraphQLError {
  constructor(message = 'Usuário não autenticado.') {
    super(message, 'UNAUTHORIZED', 'UnauthorizedError')
  }
}
