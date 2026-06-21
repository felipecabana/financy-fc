import { AppGraphQLError } from './AppGraphQLError.js'

export class NoPermissionError extends AppGraphQLError {
  constructor(message = 'Sem permissão para realizar esta ação.') {
    super(message, 'FORBIDDEN', 'NoPermissionError')
  }
}
