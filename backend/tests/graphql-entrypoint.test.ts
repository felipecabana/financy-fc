// Smoke: confirma que o schema composto em graphql/index.ts sobe e os módulos convivem.
import type { Request } from 'express'
import { ApolloServer } from '@apollo/server'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import { buildContext } from '../src/config/index.js'
import { resolvers, typeDefs } from '../src/graphql/index.js'
import {
  createEmailCleanup,
  getApolloSingleResult,
  signupForBearer,
} from './helpers/auth-test-utils.js'
import { DEFAULT_CATEGORY_COUNT } from './helpers/category-test-utils.js'

const ME_QUERY = `query { me { id email } }`
const LIST_CATEGORIES = `query { listCategories { id name } }`

function mockRequest(authorization?: string): Request {
  return {
    headers: authorization === undefined ? {} : { authorization },
  } as Request
}

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

  it('schema composto resolve health, me e categorias no mesmo servidor', async () => {
    const health = getApolloSingleResult(await server.executeOperation({ query: '{ _health }' }))
    expect(health.data?._health).toBe('ok')

    const auth = await signupForBearer(cleanup, 'entrypoint')
    const context = await buildContext({ req: mockRequest(`Bearer ${auth.token}`) })

    const me = getApolloSingleResult(
      await server.executeOperation({ query: ME_QUERY }, { contextValue: context }),
    )
    expect(me.data?.me).toMatchObject({ id: auth.user.id, email: auth.email })

    const categories = getApolloSingleResult(
      await server.executeOperation({ query: LIST_CATEGORIES }, { contextValue: context }),
    )
    expect(categories.errors).toBeUndefined()
    expect(categories.data?.listCategories).toHaveLength(DEFAULT_CATEGORY_COUNT)
  })
})
