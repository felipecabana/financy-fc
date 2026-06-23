// Smoke HTTP: CRUD de categorias no servidor real.
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
import { categoryInput } from './helpers/category-test-utils.js'
import { startSmokeServer, stopSmokeServer } from './helpers/smoke-server.js'

const CREATE_CATEGORY = `
  mutation CreateCategory($data: CreateCategoryInput!) {
    createCategory(data: $data) { id name userId icon color }
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
let graphqlUrl: string

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

  it('CRUD de categorias com Bearer token', async () => {
    const auth = await signup('http-cat')

    const created = (await postGraphql(
      CREATE_CATEGORY,
      { data: categoryInput({ name: 'Alimentação', icon: 'shopping-cart', color: 'orange' }) },
      auth.token,
    )) as { data?: { createCategory: { id: string; name: string; icon: string; color: string } } }

    const categoryId = created.data!.createCategory.id
    expect(created.data?.createCategory.icon).toBe('shopping-cart')

    const listed = (await postGraphql(LIST_CATEGORIES, undefined, auth.token)) as {
      data?: { listCategories: unknown[] }
    }
    expect(listed.data?.listCategories).toHaveLength(1)

    const updated = (await postGraphql(
      UPDATE_CATEGORY,
      { id: categoryId, data: categoryInput({ name: 'Mercado', icon: 'utensils', color: 'green' }) },
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
      { data: categoryInput({ name: 'Transporte', icon: 'car-front', color: 'blue' }) },
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
    expectGraphqlError(
      crossRead.errors?.[0],
      DOMAIN_ERRORS.noPermission,
      DOMAIN_ERROR_CODES.FORBIDDEN,
    )
  })

  it('rejeita listCategories sem token', async () => {
    const result = (await postGraphql(LIST_CATEGORIES)) as {
      errors?: Array<{ message: string; extensions?: { code?: string } }>
    }

    expectGraphqlError(
      result.errors?.[0],
      DOMAIN_ERRORS.unauthenticated,
      DOMAIN_ERROR_CODES.UNAUTHORIZED,
    )
  })
})
