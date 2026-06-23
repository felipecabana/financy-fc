// Testes GraphQL in-process: validam mutations via ApolloServer sem subir HTTP.
import { ApolloServer } from '@apollo/server'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { verifyPassword } from '../src/helpers/password.js'
import { prismaClient } from '../prisma/prisma.js'
import { resolvers, typeDefs } from '../src/graphql/index.js'
import type { GraphqlContext } from '../src/config/context/index.js'
import { AUTH_COOKIE_NAME } from '../src/helpers/auth-cookie.js'
import {
  createEmailCleanup,
  getApolloSingleResult,
  expectValidAuthPayload,
  LOGIN_MUTATION,
  SIGNUP_MUTATION,
  signupData,
  TEST_PASSWORD,
  TEST_NAME,
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

  function createAuthContext(): GraphqlContext {
    const res = { cookie: vi.fn() }
    return { res: res as never, validate: () => '' }
  }

  it('signup retorna usuário público, seta cookie e persiste senha hasheada', async () => {
    const email = uniqueEmail('auth-mutation')
    cleanup.track(email)
    const context = createAuthContext()

    const result = getApolloSingleResult(
      await server.executeOperation(
        {
          query: SIGNUP_MUTATION,
          variables: { data: signupData(email) },
        },
        { contextValue: context },
      ),
    )

    expect(result.errors).toBeUndefined()

    const signup = result.data?.signup as AuthPayload
    expect(signup.user.name).toBe(TEST_NAME)
    expectValidAuthPayload(signup, email)
    expect(context.res?.cookie).toHaveBeenCalledWith(
      AUTH_COOKIE_NAME,
      expect.any(String),
      expect.objectContaining({ httpOnly: true }),
    )

    const stored = await prismaClient.user.findUnique({ where: { email } })
    expect(stored?.name).toBe(TEST_NAME)
    expect(stored?.password).not.toBe(TEST_PASSWORD)
    await expect(verifyPassword(TEST_PASSWORD, stored!.password)).resolves.toBe(true)
  })

  it('login retorna usuário público e seta cookie com credenciais válidas', async () => {
    const email = uniqueEmail('auth-mutation')
    cleanup.track(email)

    await server.executeOperation(
      {
        query: SIGNUP_MUTATION,
        variables: { data: signupData(email) },
      },
      { contextValue: createAuthContext() },
    )

    const context = createAuthContext()
    const result = getApolloSingleResult(
      await server.executeOperation(
        {
          query: LOGIN_MUTATION,
          variables: { data: { email, password: TEST_PASSWORD } },
        },
        { contextValue: context },
      ),
    )

    expect(result.errors).toBeUndefined()
    expectValidAuthPayload(result.data?.login as AuthPayload, email)
    expect(context.res?.cookie).toHaveBeenCalledWith(
      AUTH_COOKIE_NAME,
      expect.any(String),
      expect.objectContaining({ httpOnly: true }),
    )
  })

  it('signup rejeita email duplicado', async () => {
    const email = uniqueEmail('auth-mutation')
    cleanup.track(email)

    await server.executeOperation({
      query: SIGNUP_MUTATION,
      variables: { data: signupData(email) },
    })

    const result = getApolloSingleResult(
      await server.executeOperation({
        query: SIGNUP_MUTATION,
        variables: { data: signupData(email, 'other-password') },
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
      variables: { data: signupData(email) },
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
