import { prismaClient } from '../../prisma/prisma.js'
import { DEFAULT_CATEGORIES } from '../helpers/default-categories.js'
import { createToken } from '../helpers/jwt.js'
import { hashPassword, verifyPassword } from '../helpers/password.js'
import { NoPermissionError } from '../errors/NoPermissionError.js'
import { UnauthorizedError } from '../errors/UnauthorizedError.js'

interface SignupInput {
  name: string
  email: string
  password: string
}

interface LoginInput {
  email: string
  password: string
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

class AuthService {
  private assertLoginFields(data: LoginInput) {
    if (!data.email?.trim() || !data.password?.trim()) {
      throw new UnauthorizedError('Email e senha são obrigatórios.')
    }
  }

  private assertSignupFields(data: SignupInput) {
    if (!data.name?.trim() || !data.email?.trim() || !data.password?.trim()) {
      throw new UnauthorizedError('Nome, email e senha são obrigatórios.')
    }
  }

  async signup(data: SignupInput) {
    this.assertSignupFields(data)

    const existing = await prismaClient.user.findUnique({ where: { email: data.email } })
    if (existing) throw new NoPermissionError('Email já cadastrado.')

    const password = await hashPassword(data.password)
    const user = await prismaClient.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: { name: data.name.trim(), email: data.email, password },
      })

      await tx.category.createMany({
        data: DEFAULT_CATEGORIES.map((category) => ({
          name: category.name,
          description: category.description,
          icon: category.icon,
          color: category.color,
          userId: created.id,
        })),
      })

      return created
    })

    return { token: createToken(user.id), user: toPublicUser(user) }
  }

  async login(data: LoginInput) {
    this.assertLoginFields(data)

    const user = await prismaClient.user.findUnique({ where: { email: data.email } })
    if (!user) throw new UnauthorizedError('Credenciais inválidas.')

    const valid = await verifyPassword(data.password, user.password)
    if (!valid) throw new UnauthorizedError('Credenciais inválidas.')

    return { token: createToken(user.id), user: toPublicUser(user) }
  }
}

export default new AuthService()
