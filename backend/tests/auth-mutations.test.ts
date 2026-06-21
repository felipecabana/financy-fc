// Testes GraphQL in-process: validam mutations via ApolloServer sem subir HTTP.
import { ApolloServer } from '@apollo/server'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import { verifyPassword } from '../src/helpers/password.js'
import { prismaClient } from '../prisma/prisma.js'
import { resolvers, typeDefs } from '../src/graphql/index.js'
import {
  createEmailCleanup,
  getApolloSingleResult,
  expectValidAuthPayload,
  LOGIN_MUTATION,
  SIGNUP_MUTATION,
  TEST_PASSWORD,
  uniqueEmail,
  type AuthPayload,
} from './helpers/auth-test-utils.js'
import {
  DOMAIN_ERROR_CODES,
  DOMAIN_ERRORS,
  expectGraphqlError,
} from './helpers/domain-error-assertions.js'

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
    expectGraphqlError(
      result.errors?.[0],
      DOMAIN_ERRORS.duplicateEmail,
      DOMAIN_ERROR_CODES.FORBIDDEN,
    )
  })

  it('login rejeita credenciais inválidas', async () => {
    const email = uniqueEmail('auth-mutation')
    cleanup.track(email)

    await server.executeOperation({
      query: SIGNUP_MUTATION,
      variables: { data: { email, password: TEST_PASSWORD } },
    })

    const result = getApolloSingleResult(
      await server.executeOperation({
        query: LOGIN_MUTATION,
        variables: { data: { email, password: 'wrong-password' } },
      }),
    )

    expect(result.data?.login).toBeUndefined()
    expectGraphqlError(
      result.errors?.[0],
      DOMAIN_ERRORS.invalidCredentials,
      DOMAIN_ERROR_CODES.UNAUTHORIZED,
    )
  })
})
