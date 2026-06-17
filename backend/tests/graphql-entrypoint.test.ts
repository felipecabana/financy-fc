// Smoke de wiring: confirma _health, signup, login e me no mesmo schema do entrypoint.
import type { Request } from 'express'
import { ApolloServer } from '@apollo/server'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import { buildContext, type GraphqlContext } from '../src/config/index.js'
import { resolvers, typeDefs } from '../src/graphql/index.js'
import {
  createEmailCleanup,
  expectValidAuthPayload,
  getApolloSingleResult,
  LOGIN_MUTATION,
  SIGNUP_MUTATION,
  TEST_PASSWORD,
  uniqueEmail,
  type AuthPayload,
} from './helpers/auth-test-utils.js'

const ME_QUERY = `
  query Me {
    me {
      id
      email
      createdAt
      updatedAt
    }
  }
`

function mockRequest(authorization?: string): Request {
  return {
    headers: authorization === undefined ? {} : { authorization },
  } as Request
}

describe('graphql entrypoint', () => {
  let server: ApolloServer<GraphqlContext>
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

  it('expõe _health, signup e login no mesmo schema', async () => {
    const health = getApolloSingleResult(await server.executeOperation({ query: '{ _health }' }))

    expect(health.errors).toBeUndefined()
    expect(health.data?._health).toBe('ok')

    const email = uniqueEmail('entrypoint')
    cleanup.track(email)

    const signup = getApolloSingleResult(
      await server.executeOperation({
        query: SIGNUP_MUTATION,
        variables: { data: { email, password: TEST_PASSWORD } },
      }),
    )

    expect(signup.errors).toBeUndefined()
    expectValidAuthPayload(signup.data?.signup as AuthPayload, email)

    const login = getApolloSingleResult(
      await server.executeOperation({
        query: LOGIN_MUTATION,
        variables: { data: { email, password: TEST_PASSWORD } },
      }),
    )

    expect(login.errors).toBeUndefined()
    expectValidAuthPayload(login.data?.login as AuthPayload, email)
  })

  it('expõe me como query protegida no schema composto', async () => {
    const email = uniqueEmail('entrypoint-me')
    cleanup.track(email)

    const signup = getApolloSingleResult(
      await server.executeOperation({
        query: SIGNUP_MUTATION,
        variables: { data: { email, password: TEST_PASSWORD } },
      }),
    )

    expect(signup.errors).toBeUndefined()
    const auth = signup.data?.signup as AuthPayload

    const authenticated = getApolloSingleResult(
      await server.executeOperation(
        { query: ME_QUERY },
        { contextValue: await buildContext({ req: mockRequest(`Bearer ${auth.token}`) }) },
      ),
    )

    expect(authenticated.errors).toBeUndefined()
    expect(authenticated.data?.me).toEqual({
      id: auth.user.id,
      email,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    })

    const unauthenticated = getApolloSingleResult(
      await server.executeOperation(
        { query: ME_QUERY },
        { contextValue: await buildContext({ req: mockRequest() }) },
      ),
    )

    expect(unauthenticated.data?.me).toBeUndefined()
    expect(unauthenticated.errors?.[0]?.message).toBe('Usuário não autenticado.')
  })
})
