// Testes GraphQL in-process: validam mutations via ApolloServer sem subir HTTP.
import { ApolloServer } from '@apollo/server'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import { verifyPassword } from '../src/helpers/password.js'
import { prismaClient } from '../prisma/prisma.js'
import { resolvers, typeDefs } from '../src/graphql/index.js'
import {
  AUTH_ERRORS,
  createEmailCleanup,
  getApolloSingleResult,
  expectValidAuthPayload,
  LOGIN_MUTATION,
  SIGNUP_MUTATION,
  TEST_PASSWORD,
  uniqueEmail,
  type AuthPayload,
} from './helpers/auth-test-utils.js'

describe('auth mutations (GraphQL)', () => {
  let server: ApolloServer
  const cleanup = createEmailCleanup()

  beforeAll(async () => {
    server = new ApolloServer({ typeDefs, resolvers })
    await server.start()
  })

  afterAll(async () => {
    await server.stop()
  })

  afterEach(async () => {
    await cleanup.reset()
  })

  it('signup retorna usuário público, token válido e persiste senha hasheada', async () => {
    const email = uniqueEmail('auth-mutation')
    cleanup.track(email)

    const result = getApolloSingleResult(
      await server.executeOperation({
        query: SIGNUP_MUTATION,
        variables: { data: { email, password: TEST_PASSWORD } },
      }),
    )

    expect(result.errors).toBeUndefined()

    const signup = result.data?.signup as AuthPayload
    expectValidAuthPayload(signup, email)

    const stored = await prismaClient.user.findUnique({ where: { email } })
    expect(stored?.password).not.toBe(TEST_PASSWORD)
    await expect(verifyPassword(TEST_PASSWORD, stored!.password)).resolves.toBe(true)
  })

  it('login retorna JWT e usuário público com credenciais válidas', async () => {
    const email = uniqueEmail('auth-mutation')
    cleanup.track(email)

    await server.executeOperation({
      query: SIGNUP_MUTATION,
      variables: { data: { email, password: TEST_PASSWORD } },
    })

    const result = getApolloSingleResult(
      await server.executeOperation({
        query: LOGIN_MUTATION,
        variables: { data: { email, password: TEST_PASSWORD } },
      }),
    )

    expect(result.errors).toBeUndefined()
    expectValidAuthPayload(result.data?.login as AuthPayload, email)
  })

  it('signup rejeita email duplicado', async () => {
    const email = uniqueEmail('auth-mutation')
    cleanup.track(email)

    await server.executeOperation({
      query: SIGNUP_MUTATION,
      variables: { data: { email, password: TEST_PASSWORD } },
    })

    const result = getApolloSingleResult(
      await server.executeOperation({
        query: SIGNUP_MUTATION,
        variables: { data: { email, password: 'other-password' } },
      }),
    )

    expect(result.data?.signup).toBeUndefined()
    expect(result.errors?.[0]?.message).toBe(AUTH_ERRORS.duplicateEmail)
  })

  it('login rejeita credenciais inválidas sem revelar se o email existe', async () => {
    const email = uniqueEmail('auth-mutation')
    cleanup.track(email)

    await server.executeOperation({
      query: SIGNUP_MUTATION,
      variables: { data: { email, password: TEST_PASSWORD } },
    })

    const missingEmail = getApolloSingleResult(
      await server.executeOperation({
        query: LOGIN_MUTATION,
        variables: { data: { email: 'missing@example.com', password: TEST_PASSWORD } },
      }),
    )

    const wrongPassword = getApolloSingleResult(
      await server.executeOperation({
        query: LOGIN_MUTATION,
        variables: { data: { email, password: 'wrong-password' } },
      }),
    )

    expect(missingEmail.data?.login).toBeUndefined()
    expect(wrongPassword.data?.login).toBeUndefined()
    expect(missingEmail.errors?.[0]?.message).toBe(AUTH_ERRORS.invalidCredentials)
    expect(wrongPassword.errors?.[0]?.message).toBe(AUTH_ERRORS.invalidCredentials)
  })
})
