// Smoke HTTP: CRUD de categorias no servidor real.
import { type ChildProcess, spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import {
  createEmailCleanup,
  SIGNUP_MUTATION,
  TEST_PASSWORD,
  uniqueEmail,
  type AuthPayload,
  type SignupResponse,
} from './helpers/auth-test-utils.js'

const CREATE_CATEGORY = `
  mutation CreateCategory($data: CreateCategoryInput!) {
    createCategory(data: $data) { id name userId }
  }
`

const LIST_CATEGORIES = `query { listCategories { id name } }`

const UPDATE_CATEGORY = `
  mutation UpdateCategory($id: String!, $data: UpdateCategoryInput!) {
    updateCategory(id: $id, data: $data) { name }
  }
`

const DELETE_CATEGORY = `mutation DeleteCategory($id: String!) { deleteCategory(id: $id) }`

const GET_CATEGORY = `query GetCategory($id: String!) { getCategory(id: $id) { id } }`

const backendRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const smokePort = 4099
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
      // servidor ainda subindo
    }

    await new Promise((resolve) => setTimeout(resolve, 200))
  }

  throw new Error('Timeout aguardando servidor HTTP')
}

async function postGraphql(
  query: string,
  variables?: Record<string, unknown>,
  token?: string,
) {
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

describe('category HTTP smoke', () => {
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

    const result = (await postGraphql(SIGNUP_MUTATION, {
      data: { email, password: TEST_PASSWORD },
    })) as SignupResponse

    return result.data!.signup as AuthPayload
  }

  it('CRUD de categorias com Bearer token', async () => {
    const auth = await signup('http-cat')

    const created = (await postGraphql(
      CREATE_CATEGORY,
      { data: { name: 'Alimentação' } },
      auth.token,
    )) as { data?: { createCategory: { id: string; name: string } } }

    const categoryId = created.data!.createCategory.id

    const listed = (await postGraphql(LIST_CATEGORIES, undefined, auth.token)) as {
      data?: { listCategories: unknown[] }
    }
    expect(listed.data?.listCategories).toHaveLength(1)

    const updated = (await postGraphql(
      UPDATE_CATEGORY,
      { id: categoryId, data: { name: 'Mercado' } },
      auth.token,
    )) as { data?: { updateCategory: { name: string } } }
    expect(updated.data?.updateCategory.name).toBe('Mercado')

    const deleted = (await postGraphql(DELETE_CATEGORY, { id: categoryId }, auth.token)) as {
      data?: { deleteCategory: boolean }
    }
    expect(deleted.data?.deleteCategory).toBe(true)
  })

  it('isola categorias entre usuários', async () => {
    const owner = await signup('http-owner')
    const other = await signup('http-other')

    const created = (await postGraphql(
      CREATE_CATEGORY,
      { data: { name: 'Transporte' } },
      owner.token,
    )) as { data?: { createCategory: { id: string } } }

    const otherList = (await postGraphql(LIST_CATEGORIES, undefined, other.token)) as {
      data?: { listCategories: unknown[] }
    }
    const crossRead = (await postGraphql(
      GET_CATEGORY,
      { id: created.data!.createCategory.id },
      other.token,
    )) as { errors?: Array<{ message: string }> }

    expect(otherList.data?.listCategories).toEqual([])
    expect(crossRead.errors?.[0]?.message).toBe('Sem permissão para realizar esta ação.')
  })

  it('rejeita listCategories sem token', async () => {
    const result = (await postGraphql(LIST_CATEGORIES)) as {
      errors?: Array<{ message: string }>
    }

    expect(result.errors?.[0]?.message).toBe('Usuário não autenticado.')
  })
})
