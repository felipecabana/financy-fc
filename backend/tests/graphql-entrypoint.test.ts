// Smoke de wiring: confirma _health, signup e login no mesmo schema do entrypoint.
import { ApolloServer } from '@apollo/server'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

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

describe('graphql entrypoint', () => {
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
})
