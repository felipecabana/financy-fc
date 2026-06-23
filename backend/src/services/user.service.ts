import { prismaClient } from '../../prisma/prisma.js'
import { NotFoundError } from '../errors/NotFoundError.js'
import { UnauthorizedError } from '../errors/UnauthorizedError.js'

interface UpdateUserInput {
  name: string
}

const toPublicUser = (user: {
  id: string
  name: string
  email: string
  createdAt: Date
  updatedAt: Date
}) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  createdAt: user.createdAt.toISOString(),
  updatedAt: user.updatedAt.toISOString(),
})

class UserService {
  private assertName(name: string | undefined) {
    if (!name?.trim()) {
      throw new UnauthorizedError('Nome é obrigatório.')
    }
  }

  async getUser(userId: string) {
    const user = await prismaClient.user.findUnique({ where: { id: userId } })

    if (!user) {
      throw new NotFoundError('Usuário')
    }

    return toPublicUser(user)
  }

  async updateUser(userId: string, data: UpdateUserInput) {
    this.assertName(data.name)

    await this.getUser(userId)

    const user = await prismaClient.user.update({
      where: { id: userId },
      data: { name: data.name.trim() },
    })

    return toPublicUser(user)
  }
}

export default new UserService()
