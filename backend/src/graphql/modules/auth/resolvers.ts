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
    signup: async (_: unknown, { data }: { data: SignupInput }) => authService.signup(data),
    login: async (_: unknown, { data }: { data: LoginInput }) => authService.login(data),
  },
}
