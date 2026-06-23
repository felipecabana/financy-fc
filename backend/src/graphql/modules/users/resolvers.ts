import type { GraphqlContext } from '../../../config/context/index.js'
import userService from '../../../services/user.service.js'

export interface UpdateUserInput {
  name: string
}

export default {
  Query: {
    me: async (_: unknown, __: unknown, context: GraphqlContext) => {
      const userId = context.validate()
      return userService.getUser(userId)
    },
  },
  Mutation: {
    updateUser: async (
      _: unknown,
      { data }: { data: UpdateUserInput },
      context: GraphqlContext,
    ) => {
      const userId = context.validate()
      return userService.updateUser(userId, data)
    },
  },
}
