// Testes GraphQL in-process: CRUD de categorias e isolamento entre usuários.
import type { Request } from 'express'
import { ApolloServer } from '@apollo/server'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import { buildContext } from '../src/config/index.js'
import { resolvers, typeDefs } from '../src/graphql/index.js'
import {
  createEmailCleanup,
  getApolloSingleResult,
  SIGNUP_MUTATION,
  TEST_PASSWORD,
  uniqueEmail,
  type AuthPayload,
} from './helpers/auth-test-utils.js'

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
    const email = uniqueEmail(prefix)
    cleanup.track(email)

    const result = getApolloSingleResult(
      await server.executeOperation({
        query: SIGNUP_MUTATION,
        variables: { data: { email, password: TEST_PASSWORD } },
      }),
    )

    return result.data?.signup as AuthPayload
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
    const crossUpdate = await asUser(other.token, UPDATE_CATEGORY, {
      id: categoryId,
      data: { name: 'Inválido' },
    })
    const crossDelete = await asUser(other.token, DELETE_CATEGORY, { id: categoryId })

    expect(otherList.data?.listCategories).toEqual([])
    expect(crossRead.errors?.[0]?.message).toBe('Sem permissão para realizar esta ação.')
    expect(crossUpdate.errors?.[0]?.message).toBe('Sem permissão para realizar esta ação.')
    expect(crossDelete.errors?.[0]?.message).toBe('Sem permissão para realizar esta ação.')
  })

  it('rejeita nome vazio e categoria inexistente', async () => {
    const auth = await signup('category-errors')

    const emptyName = await asUser(auth.token, CREATE_CATEGORY, { data: { name: '   ' } })
    expect(emptyName.errors?.[0]?.message).toBe('Nome é obrigatório.')

    const missing = await asUser(auth.token, GET_CATEGORY, {
      id: '00000000-0000-0000-0000-000000000000',
    })
    expect(missing.errors?.[0]?.message).toBe('Categoria não encontrada.')
  })

  it('rejeita sem token', async () => {
    const result = getApolloSingleResult(
      await server.executeOperation(
        { query: LIST_CATEGORIES },
        { contextValue: await buildContext({ req: mockRequest() }) },
      ),
    )

    expect(result.errors?.[0]?.message).toBe('Usuário não autenticado.')
  })
})
