import { prismaClient } from '../../prisma/prisma.js'
import { createToken } from '../helpers/jwt.js'
import { hashPassword, verifyPassword } from '../helpers/password.js'

interface SignupInput {
  email: string
  password: string
}

interface LoginInput {
  email: string
  password: string
}

const toPublicUser = (user: {
  id: string
  email: string
  createdAt: Date
  updatedAt: Date
}) => ({
  id: user.id,
  email: user.email,
  createdAt: user.createdAt.toISOString(),
  updatedAt: user.updatedAt.toISOString(),
})

class AuthService {
  private assertRequiredFields(data: SignupInput | LoginInput) {
    if (!data.email?.trim() || !data.password?.trim()) {
      throw new Error('Email e senha são obrigatórios.')
    }
  }

  async signup(data: SignupInput) {
    this.assertRequiredFields(data)

    const existing = await prismaClient.user.findUnique({ where: { email: data.email } })
    if (existing) throw new Error('Email já cadastrado.')

    const password = await hashPassword(data.password)
    const user = await prismaClient.user.create({
      data: { email: data.email, password },
    })

    return { token: createToken(user.id), user: toPublicUser(user) }
  }

  async login(data: LoginInput) {
    this.assertRequiredFields(data)

    const user = await prismaClient.user.findUnique({ where: { email: data.email } })
    if (!user) throw new Error('Credenciais inválidas.')

    const valid = await verifyPassword(data.password, user.password)
    if (!valid) throw new Error('Credenciais inválidas.')

    return { token: createToken(user.id), user: toPublicUser(user) }
  }
}

export default new AuthService()
