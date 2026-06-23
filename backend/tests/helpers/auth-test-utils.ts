import type { GraphQLResponse } from '@apollo/server'
import { expect } from 'vitest'

import { prismaClient } from '../../prisma/prisma.js'
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
      token
      user { id name email createdAt updatedAt }
    }
  }
`

export const LOGIN_MUTATION = `
  mutation Login($data: LoginInput!) {
    login(data: $data) {
      token
      user { id name email createdAt updatedAt }
    }
  }
`

export type PublicUser = {
  id: string
  name: string
  email: string
  createdAt: string
  updatedAt: string
}

export type AuthPayload = {
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
  expect(verifyToken(payload.token).id).toBe(payload.user.id)
}
