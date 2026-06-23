// Integração: GraphQL + formatError (pipeline igual ao servidor de produção).
import type { Request } from 'express'
import { ApolloServer } from '@apollo/server'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { buildContext, formatError } from '../src/config/index.js'
import { resolvers, typeDefs } from '../src/graphql/index.js'
import { prismaClient } from '../prisma/prisma.js'
import categoryService from '../src/services/category.service.js'
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
import { categoryInput } from './helpers/category-test-utils.js'

const LIST_CATEGORIES = `query { listCategories { id name } }`

const GET_CATEGORY = `
  query GetCategory($id: String!) {
    getCategory(id: $id) { id name }
  }
`

const CREATE_CATEGORY = `
  mutation CreateCategory($data: CreateCategoryInput!) {
    createCategory(data: $data) { id name }
  }
`

const ME_QUERY = `query { me { id email } }`

function mockRequest(authorization?: string): Request {
  return {
    headers: authorization === undefined ? {} : { authorization },
  } as Request
}

describe('GraphQL errors (integração com formatError)', () => {
  let server: ApolloServer
  const cleanup = createEmailCleanup()

  beforeAll(async () => {
    server = new ApolloServer({ typeDefs, resolvers, formatError })
    await server.start()
  })

  afterAll(async () => {
    await server.stop()
  })

  afterEach(async () => {
    vi.restoreAllMocks()
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

  it('UNAUTHORIZED: query protegida sem token', async () => {
    const result = getApolloSingleResult(
      await server.executeOperation(
        { query: LIST_CATEGORIES },
        { contextValue: await buildContext({ req: mockRequest() }) },
      ),
    )

    expectGraphqlError(
      result.errors?.[0],
      DOMAIN_ERRORS.unauthenticated,
      DOMAIN_ERROR_CODES.UNAUTHORIZED,
    )
  })

  it('FORBIDDEN: leitura de categoria de outro usuário', async () => {
    const owner = await signup('errors-owner')
    const other = await signup('errors-other')

    const created = await asUser(owner.token, CREATE_CATEGORY, {
      data: categoryInput({ name: 'Saúde' }),
    })
    const categoryId = created.data!.createCategory.id

    const crossRead = await asUser(other.token, GET_CATEGORY, { id: categoryId })

    expectGraphqlError(
      crossRead.errors?.[0],
      DOMAIN_ERRORS.noPermission,
      DOMAIN_ERROR_CODES.FORBIDDEN,
    )
  })

  it('NOT_FOUND: categoria inexistente', async () => {
    const auth = await signup('errors-not-found')

    const result = await asUser(auth.token, GET_CATEGORY, {
      id: '00000000-0000-0000-0000-000000000000',
    })

    expectGraphqlError(
      result.errors?.[0],
      DOMAIN_ERRORS.categoryNotFound,
      DOMAIN_ERROR_CODES.NOT_FOUND,
    )
  })

  it('UNAUTHORIZED: validação de nome vazio em categoria', async () => {
    const auth = await signup('errors-validation')

    const result = await asUser(auth.token, CREATE_CATEGORY, {
      data: categoryInput({ name: '   ' }),
    })

    expectGraphqlError(
      result.errors?.[0],
      DOMAIN_ERRORS.categoryNameRequired,
      DOMAIN_ERROR_CODES.UNAUTHORIZED,
    )
  })

  it('NOT_FOUND: me com token válido mas usuário removido', async () => {
    const auth = await signup('errors-me')

    await prismaClient.user.delete({ where: { id: auth.user.id } })

    const result = await asUser(auth.token, ME_QUERY)

    expectGraphqlError(
      result.errors?.[0],
      DOMAIN_ERRORS.userNotFound,
      DOMAIN_ERROR_CODES.NOT_FOUND,
    )
  })

  it('INTERNAL_SERVER_ERROR: oculta falha inesperada do service', async () => {
    const auth = await signup('errors-internal')

    vi.spyOn(categoryService, 'listCategories').mockRejectedValueOnce(
      new Error('detalhe interno sensível do banco'),
    )

    const result = await asUser(auth.token, LIST_CATEGORIES)

    expect(result.errors?.[0]).toMatchObject({
      message: 'Erro interno.',
      extensions: { code: 'INTERNAL_SERVER_ERROR' },
    })
    expect(result.errors?.[0]?.extensions?.stacktrace).toBeUndefined()
    expect(JSON.stringify(result.errors?.[0])).not.toContain('detalhe interno sensível')
  })
})
