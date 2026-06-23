import type { GraphQLResponse } from '@apollo/server'
import { expect } from 'vitest'

import { prismaClient } from '../../prisma/prisma.js'
import authService from '../../src/services/auth.service.js'
import { AUTH_COOKIE_NAME } from '../../src/helpers/auth-cookie.js'
import { verifyToken } from '../../src/helpers/jwt.js'

export const TEST_PASSWORD = 'secret123'
export const TEST_NAME = 'Maria Silva'

export const AUTH_ERRORS = {
  duplicateEmail: 'Email já cadastrado.',
  invalidCredentials: 'Credenciais inválidas.',
  requiredFields: 'Email e senha são obrigatórios.',
} as const

export function signupData(email: string, password = TEST_PASSWORD, name = TEST_NAME) {
  return { name, email, password }
}

export const SIGNUP_MUTATION = `
  mutation Signup($data: SignupInput!) {
    signup(data: $data) {
      user { id name email createdAt updatedAt }
    }
  }
`

export const LOGIN_MUTATION = `
  mutation Login($data: LoginInput!) {
    login(data: $data) {
      user { id name email createdAt updatedAt }
    }
  }
`

export const LOGOUT_MUTATION = `mutation { logout }`

export const ME_QUERY = `query { me { id email } }`

export type PublicUser = {
  id: string
  name: string
  email: string
  createdAt: string
  updatedAt: string
}

export type AuthPayload = {
  user: PublicUser
}

export type ServiceAuthResult = {
  token: string
  user: PublicUser
}

export type GraphqlResult<T> = {
  data?: T
  errors?: Array<{ message: string }>
}

export type SignupResponse = GraphqlResult<{ signup: AuthPayload }>
export type LoginResponse = GraphqlResult<{ login: AuthPayload }>

export function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`
}

export function createEmailCleanup() {
  const emails: string[] = []

  return {
    track(email: string) {
      emails.push(email)
    },
    async reset() {
      if (emails.length === 0) return

      await prismaClient.user.deleteMany({ where: { email: { in: emails } } })
      emails.length = 0
    },
  }
}

export function getApolloSingleResult(response: GraphQLResponse) {
  expect(response.body.kind).toBe('single')
  if (response.body.kind !== 'single') {
    throw new Error('Resposta GraphQL inesperada')
  }
  return response.body.singleResult
}

export function expectValidAuthPayload(payload: AuthPayload, email: string) {
  expect(payload.user.email).toBe(email)
  expect(payload.user).not.toHaveProperty('password')
  expect(payload).not.toHaveProperty('token')
}

export function expectValidServiceAuth(result: ServiceAuthResult, email: string) {
  expect(result.user.email).toBe(email)
  expect(result.user).not.toHaveProperty('password')
  expect(verifyToken(result.token).id).toBe(result.user.id)
}

export async function signupForBearer(
  cleanup: ReturnType<typeof createEmailCleanup>,
  prefix: string,
): Promise<ServiceAuthResult & { email: string }> {
  const email = uniqueEmail(prefix)
  cleanup.track(email)

  const result = await authService.signup(signupData(email))
  return { ...result, email }
}

export function expectHttpAuthCookie(headers: Headers) {
  const setCookie = headers.get('set-cookie') ?? ''
  expect(setCookie).toContain(`${AUTH_COOKIE_NAME}=`)
  expect(setCookie.toLowerCase()).toContain('httponly')
}

export function readSessionCookieHeader(headers: Headers): string {
  return (headers.get('set-cookie') ?? '').split(';')[0].trim()
}

export function readAuthTokenFromSetCookie(headers: Headers): string {
  const header = readSessionCookieHeader(headers)
  const prefix = `${AUTH_COOKIE_NAME}=`
  if (!header.startsWith(prefix)) {
    throw new Error('Cookie de sessão não encontrado')
  }
  return header.slice(prefix.length)
}

export function expectHttpAuthCookieCleared(headers: Headers) {
  const setCookie = headers.get('set-cookie') ?? ''
  expect(setCookie).toContain(`${AUTH_COOKIE_NAME}=`)
  expect(setCookie.toLowerCase()).toMatch(/expires=|max-age=0/)
}
