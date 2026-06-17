import type { GraphqlContext } from '../../../config/context/index.js'
import { prismaClient } from '../../../../prisma/prisma.js'

export default {
  Query: {
    me: async (_: unknown, __: unknown, context: GraphqlContext) => {
      const userId = context.validate()
      const user = await prismaClient.user.findUnique({ where: { id: userId } })

      if (!user) {
        throw new Error('Usuário não encontrado.')
      }

      return {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      }
    },
  },
}
