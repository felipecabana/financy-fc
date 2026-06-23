import type { GraphqlContext } from '../../../config/context/index.js'
import { clearAuthCookie, setAuthCookie } from '../../../helpers/auth-cookie.js'
import authService from '../../../services/auth.service.js'

export interface SignupInput {
  name: string
  email: string
  password: string
}

export interface LoginInput {
  email: string
  password: string
}

export default {
  Mutation: {
    signup: async (_: unknown, { data }: { data: SignupInput }, context: GraphqlContext) => {
      const { token, user } = await authService.signup(data)
      if (context.res) setAuthCookie(context.res, token)
      return { user }
    },
    login: async (_: unknown, { data }: { data: LoginInput }, context: GraphqlContext) => {
      const { token, user } = await authService.login(data)
      if (context.res) setAuthCookie(context.res, token)
      return { user }
    },
    logout: async (_: unknown, __: unknown, context: GraphqlContext) => {
      if (context.res) clearAuthCookie(context.res)
      return true
    },
  },
}
