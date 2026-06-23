// Testes GraphQL in-process: CRUD de transações, vínculo com categoria e isolamento entre usuários.
import type { Request } from 'express'
import { ApolloServer } from '@apollo/server'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import { buildContext } from '../src/config/index.js'
import { resolvers, typeDefs } from '../src/graphql/index.js'
import {
  createEmailCleanup,
  getApolloSingleResult,
  SIGNUP_MUTATION,
  signupData,
  TEST_PASSWORD,
  uniqueEmail,
  type AuthPayload,
} from './helpers/auth-test-utils.js'
import {
  DOMAIN_ERROR_CODES,
  DOMAIN_ERRORS,
  expectGraphqlError,
} from './helpers/domain-error-assertions.js'

const CREATE_CATEGORY = `
  mutation CreateCategory($data: CreateCategoryInput!) {
    createCategory(data: $data) { id name }
  }
`

const CREATE_TRANSACTION = `
  mutation CreateTransaction($data: CreateTransactionInput!) {
    createTransaction(data: $data) {
      id title amount type userId categoryId
      category { id name }
    }
  }
`

const LIST_TRANSACTIONS = `
  query {
    listTransactions { id title amount type userId categoryId }
  }
`

const GET_TRANSACTION = `
  query GetTransaction($id: String!) {
    getTransaction(id: $id) { id title amount type }
  }
`

const UPDATE_TRANSACTION = `
  mutation UpdateTransaction($id: String!, $data: UpdateTransactionInput!) {
    updateTransaction(id: $id, data: $data) { id title amount type }
  }
`

const DELETE_TRANSACTION = `
  mutation DeleteTransaction($id: String!) {
    deleteTransaction(id: $id)
  }
`

function mockRequest(authorization?: string): Request {
  return {
    headers: authorization === undefined ? {} : { authorization },
  } as Request
}

describe('transaction CRUD (GraphQL)', () => {
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
        variables: { data: signupData(email) },
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

  it('cria, lista, atualiza e remove transação autenticado', async () => {
    const auth = await signup('transaction-crud')

    const created = await asUser(auth.token, CREATE_TRANSACTION, {
      data: { title: 'Salário', amount: 5000, type: 'receita' },
    })
    expect(created.errors).toBeUndefined()
    expect(created.data?.createTransaction).toMatchObject({
      title: 'Salário',
      amount: 5000,
      type: 'receita',
      userId: auth.user.id,
      categoryId: null,
      category: null,
    })

    const transactionId = created.data!.createTransaction.id

    const listed = await asUser(auth.token, LIST_TRANSACTIONS)
    expect(listed.data?.listTransactions).toHaveLength(1)

    const updated = await asUser(auth.token, UPDATE_TRANSACTION, {
      id: transactionId,
      data: { title: 'Salário CLT', amount: 5500 },
    })
    expect(updated.data?.updateTransaction).toMatchObject({
      title: 'Salário CLT',
      amount: 5500,
    })

    const deleted = await asUser(auth.token, DELETE_TRANSACTION, { id: transactionId })
    expect(deleted.data?.deleteTransaction).toBe(true)

    const afterDelete = await asUser(auth.token, LIST_TRANSACTIONS)
    expect(afterDelete.data?.listTransactions).toEqual([])
  })

  it('vincula categoria própria na criação', async () => {
    const auth = await signup('transaction-category')

    const category = await asUser(auth.token, CREATE_CATEGORY, { data: { name: 'Moradia' } })
    const categoryId = category.data!.createCategory.id

    const created = await asUser(auth.token, CREATE_TRANSACTION, {
      data: {
        title: 'Aluguel',
        amount: 1200,
        type: 'despesa',
        categoryId,
      },
    })

    expect(created.errors).toBeUndefined()
    expect(created.data?.createTransaction.categoryId).toBe(categoryId)
    expect(created.data?.createTransaction.category).toMatchObject({
      id: categoryId,
      name: 'Moradia',
    })
  })

  it('usuário não acessa transação de outro', async () => {
    const owner = await signup('transaction-owner')
    const other = await signup('transaction-other')

    const created = await asUser(owner.token, CREATE_TRANSACTION, {
      data: { title: 'Mercado', amount: 200, type: 'despesa' },
    })
    const transactionId = created.data!.createTransaction.id

    const otherList = await asUser(other.token, LIST_TRANSACTIONS)
    const crossRead = await asUser(other.token, GET_TRANSACTION, { id: transactionId })

    expect(otherList.data?.listTransactions).toEqual([])
    expectGraphqlError(
      crossRead.errors?.[0],
      DOMAIN_ERRORS.noPermission,
      DOMAIN_ERROR_CODES.FORBIDDEN,
    )
  })
})
