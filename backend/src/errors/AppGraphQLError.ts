import { GraphQLError } from 'graphql'

export type AppGraphQLErrorCode = 'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND'

export class AppGraphQLError extends GraphQLError {
  constructor(message: string, code: AppGraphQLErrorCode, name: string) {
    super(message, { extensions: { code } })
    this.name = name
  }
}
