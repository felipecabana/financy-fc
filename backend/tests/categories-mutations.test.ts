// Testes GraphQL in-process: CRUD de categorias e isolamento entre usuários.
import type { Request } from 'express'
import { ApolloServer } from '@apollo/server'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import { buildContext } from '../src/config/index.js'
import { resolvers, typeDefs } from '../src/graphql/index.js'
import {
  createEmailCleanup,
  getApolloSingleResult,
  signupForBearer,
  TEST_PASSWORD,
  uniqueEmail,
} from './helpers/auth-test-utils.js'
import {
  DOMAIN_ERROR_CODES,
  DOMAIN_ERRORS,
  expectGraphqlError,
} from './helpers/domain-error-assertions.js'

const CREATE_CATEGORY = `
  mutation CreateCategory($data: CreateCategoryInput!) {
    createCategory(data: $data) { id name userId }
  }
`

const LIST_CATEGORIES = `query { listCategories { id name userId } }`

const GET_CATEGORY = `
  query GetCategory($id: String!) {
    getCategory(id: $id) { id name }
  }
`

const UPDATE_CATEGORY = `
  mutation UpdateCategory($id: String!, $data: UpdateCategoryInput!) {
    updateCategory(id: $id, data: $data) { id name }
  }
`

const DELETE_CATEGORY = `
  mutation DeleteCategory($id: String!) {
    deleteCategory(id: $id)
  }
`

function mockRequest(authorization?: string): Request {
  return {
    headers: authorization === undefined ? {} : { authorization },
  } as Request
}

describe('category CRUD (GraphQL)', () => {
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

  async function signup(prefix: string) {
    return signupForBearer(cleanup, prefix)
  }

  async function asUser(token: string, query: string, variables?: Record<string, unknown>) {
    return getApolloSingleResult(
      await server.executeOperation(
        { query, variables },
        { contextValue: await buildContext({ req: mockRequest(`Bearer ${token}`) }) },
      ),
    )
  }

  it('cria, lista, atualiza e remove categoria autenticado', async () => {
    const auth = await signup('category-crud')

    const created = await asUser(auth.token, CREATE_CATEGORY, { data: { name: 'Alimentação' } })
    expect(created.errors).toBeUndefined()
    expect(created.data?.createCategory).toMatchObject({
      name: 'Alimentação',
      userId: auth.user.id,
    })

    const categoryId = created.data!.createCategory.id

    const listed = await asUser(auth.token, LIST_CATEGORIES)
    expect(listed.data?.listCategories).toHaveLength(1)

    const updated = await asUser(auth.token, UPDATE_CATEGORY, {
      id: categoryId,
      data: { name: 'Mercado' },
    })
    expect(updated.data?.updateCategory.name).toBe('Mercado')

    const deleted = await asUser(auth.token, DELETE_CATEGORY, { id: categoryId })
    expect(deleted.data?.deleteCategory).toBe(true)

    const afterDelete = await asUser(auth.token, LIST_CATEGORIES)
    expect(afterDelete.data?.listCategories).toEqual([])
  })

  it('usuário não acessa categoria de outro', async () => {
    const owner = await signup('category-owner')
    const other = await signup('category-other')

    const created = await asUser(owner.token, CREATE_CATEGORY, { data: { name: 'Saúde' } })
    const categoryId = created.data!.createCategory.id

    const otherList = await asUser(other.token, LIST_CATEGORIES)
    const crossRead = await asUser(other.token, GET_CATEGORY, { id: categoryId })

    expect(otherList.data?.listCategories).toEqual([])
    expectGraphqlError(
      crossRead.errors?.[0],
      DOMAIN_ERRORS.noPermission,
      DOMAIN_ERROR_CODES.FORBIDDEN,
    )
  })
})
