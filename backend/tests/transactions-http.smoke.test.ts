// Smoke HTTP: transações no servidor real (Express + Apollo).
import { type ChildProcess } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import {
  createEmailCleanup,
  readAuthTokenFromSetCookie,
  SIGNUP_MUTATION,
  signupData,
  uniqueEmail,
  type SignupResponse,
} from './helpers/auth-test-utils.js'
import {
  DOMAIN_ERROR_CODES,
  DOMAIN_ERRORS,
  expectGraphqlError,
} from './helpers/domain-error-assertions.js'
import { startSmokeServer, stopSmokeServer } from './helpers/smoke-server.js'

const CREATE_TRANSACTION = `
  mutation CreateTransaction($data: CreateTransactionInput!) {
    createTransaction(data: $data) { id title amount type date userId }
  }
`

const LIST_TRANSACTIONS = `query { listTransactions { id title } }`

const UPDATE_TRANSACTION = `
  mutation UpdateTransaction($id: String!, $data: UpdateTransactionInput!) {
    updateTransaction(id: $id, data: $data) { title amount date }
  }
`

const DELETE_TRANSACTION = `mutation DeleteTransaction($id: String!) { deleteTransaction(id: $id) }`

const GET_TRANSACTION = `query GetTransaction($id: String!) { getTransaction(id: $id) { id title } }`

const backendRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
let graphqlUrl: string

async function postGraphql(query: string, variables?: Record<string, unknown>, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(graphqlUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  })

  expect(response.ok).toBe(true)
  return response.json()
}

describe('transaction HTTP smoke', () => {
  let serverProcess: ChildProcess
  const cleanup = createEmailCleanup()

  beforeAll(async () => {
    const server = await startSmokeServer(backendRoot)
    graphqlUrl = server.graphqlUrl
    serverProcess = server.serverProcess
  }, 60_000)

  afterAll(async () => {
    await cleanup.reset()
    stopSmokeServer(serverProcess)
  })

  afterEach(async () => {
    await cleanup.reset()
  })

  async function signup(prefix: string) {
    const email = uniqueEmail(prefix)
    cleanup.track(email)

    const response = await fetch(graphqlUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: SIGNUP_MUTATION,
        variables: { data: signupData(email) },
      }),
    })

    expect(response.ok).toBe(true)

    const result = (await response.json()) as SignupResponse
    return {
      user: result.data!.signup.user,
      token: readAuthTokenFromSetCookie(response.headers),
    }
  }

  it('faz CRUD de transação com token', async () => {
    const auth = await signup('http-txn')

    const created = await postGraphql(
      CREATE_TRANSACTION,
      { data: { title: 'Salário', amount: 5000, type: 'receita', date: '2026-06-15' } },
      auth.token,
    )
    const transactionId = created.data.createTransaction.id
    expect(created.data.createTransaction.date).toBe('2026-06-15T00:00:00.000Z')

    const listed = await postGraphql(LIST_TRANSACTIONS, undefined, auth.token)
    expect(listed.data.listTransactions).toHaveLength(1)

    const updated = await postGraphql(
      UPDATE_TRANSACTION,
      { id: transactionId, data: { title: 'Salário CLT', amount: 5500, date: '2026-07-01' } },
      auth.token,
    )
    expect(updated.data.updateTransaction.title).toBe('Salário CLT')
    expect(updated.data.updateTransaction.date).toBe('2026-07-01T00:00:00.000Z')

    const deleted = await postGraphql(DELETE_TRANSACTION, { id: transactionId }, auth.token)
    expect(deleted.data.deleteTransaction).toBe(true)
  })

  it('não deixa um usuário ver transação de outro', async () => {
    const owner = await signup('http-txn-owner')
    const other = await signup('http-txn-other')

    const created = await postGraphql(
      CREATE_TRANSACTION,
      { data: { title: 'Mercado', amount: 180, type: 'despesa', date: '2026-06-15' } },
      owner.token,
    )
    const transactionId = created.data.createTransaction.id

    const otherList = await postGraphql(LIST_TRANSACTIONS, undefined, other.token)
    const crossRead = await postGraphql(GET_TRANSACTION, { id: transactionId }, other.token)

    expect(otherList.data.listTransactions).toEqual([])
    expectGraphqlError(
      crossRead.errors[0],
      DOMAIN_ERRORS.noPermission,
      DOMAIN_ERROR_CODES.FORBIDDEN,
    )
  })

  it('barra listTransactions sem token', async () => {
    const result = await postGraphql(LIST_TRANSACTIONS)
    expectGraphqlError(
      result.errors[0],
      DOMAIN_ERRORS.unauthenticated,
      DOMAIN_ERROR_CODES.UNAUTHORIZED,
    )
  })
})
