// Smoke HTTP: transações no servidor real (Express + Apollo).
import { type ChildProcess, spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import {
  createEmailCleanup,
  SIGNUP_MUTATION,
  TEST_PASSWORD,
  uniqueEmail,
} from './helpers/auth-test-utils.js'
import {
  DOMAIN_ERROR_CODES,
  DOMAIN_ERRORS,
  expectGraphqlError,
} from './helpers/domain-error-assertions.js'

const CREATE_TRANSACTION = `
  mutation CreateTransaction($data: CreateTransactionInput!) {
    createTransaction(data: $data) { id title amount type userId }
  }
`

const LIST_TRANSACTIONS = `query { listTransactions { id title } }`

const UPDATE_TRANSACTION = `
  mutation UpdateTransaction($id: String!, $data: UpdateTransactionInput!) {
    updateTransaction(id: $id, data: $data) { title amount }
  }
`

const DELETE_TRANSACTION = `mutation DeleteTransaction($id: String!) { deleteTransaction(id: $id) }`

const GET_TRANSACTION = `query GetTransaction($id: String!) { getTransaction(id: $id) { id title } }`

const backendRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const smokePort = 4106
const graphqlUrl = `http://127.0.0.1:${smokePort}/graphql`

async function waitForServer(process: ChildProcess) {
  const deadline = Date.now() + 30_000

  while (Date.now() < deadline) {
    if (process.exitCode !== null) {
      throw new Error('Servidor encerrou antes de ficar pronto')
    }

    try {
      const response = await fetch(graphqlUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: '{ _health }' }),
      })

      if (response.ok) return
    } catch {
      // ainda subindo
    }

    await new Promise((resolve) => setTimeout(resolve, 200))
  }

  throw new Error('Timeout aguardando servidor HTTP')
}

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
    serverProcess = spawn('npx', ['tsx', 'src/index.ts'], {
      cwd: backendRoot,
      env: { ...process.env, PORT: String(smokePort) },
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true,
    })

    await waitForServer(serverProcess)
  }, 60_000)

  afterAll(async () => {
    await cleanup.reset()
    if (!serverProcess.killed) serverProcess.kill()
  })

  afterEach(async () => {
    await cleanup.reset()
  })

  async function signup(prefix: string) {
    const email = uniqueEmail(prefix)
    cleanup.track(email)

    const result = await postGraphql(SIGNUP_MUTATION, {
      data: { email, password: TEST_PASSWORD },
    })

    return result.data.signup
  }

  it('faz CRUD de transação com token', async () => {
    const auth = await signup('http-txn')

    const created = await postGraphql(
      CREATE_TRANSACTION,
      { data: { title: 'Salário', amount: 5000, type: 'receita' } },
      auth.token,
    )
    const transactionId = created.data.createTransaction.id

    const listed = await postGraphql(LIST_TRANSACTIONS, undefined, auth.token)
    expect(listed.data.listTransactions).toHaveLength(1)

    const updated = await postGraphql(
      UPDATE_TRANSACTION,
      { id: transactionId, data: { title: 'Salário CLT', amount: 5500 } },
      auth.token,
    )
    expect(updated.data.updateTransaction.title).toBe('Salário CLT')

    const deleted = await postGraphql(DELETE_TRANSACTION, { id: transactionId }, auth.token)
    expect(deleted.data.deleteTransaction).toBe(true)
  })

  it('não deixa um usuário ver transação de outro', async () => {
    const owner = await signup('http-txn-owner')
    const other = await signup('http-txn-other')

    const created = await postGraphql(
      CREATE_TRANSACTION,
      { data: { title: 'Mercado', amount: 180, type: 'despesa' } },
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
