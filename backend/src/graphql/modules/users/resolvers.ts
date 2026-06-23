import type { GraphqlContext } from '../../../config/context/index.js'
import { NotFoundError } from '../../../errors/NotFoundError.js'
import { prismaClient } from '../../../../prisma/prisma.js'

export default {
  Query: {
    me: async (_: unknown, __: unknown, context: GraphqlContext) => {
      const userId = context.validate()
      const user = await prismaClient.user.findUnique({ where: { id: userId } })

      if (!user) {
        throw new NotFoundError('Usuário')
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      }
    },
  },
}
