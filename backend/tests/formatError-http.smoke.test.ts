// Smoke HTTP: prova que src/index.ts liga formatError no servidor real.
import { type ChildProcess } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import {
  DOMAIN_ERROR_CODES,
  DOMAIN_ERRORS,
  expectGraphqlError,
} from './helpers/domain-error-assertions.js'
import { startSmokeServer, stopSmokeServer } from './helpers/smoke-server.js'

const ME_QUERY = `query { me { id email } }`

type GraphqlErrorResponse = {
  errors?: Array<{
    message: string
    extensions?: { code?: string; stacktrace?: string[] }
  }>
}

const backendRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
let graphqlUrl: string

async function postGraphql(query: string, variables?: Record<string, unknown>) {
  const response = await fetch(graphqlUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  })

  expect(response.ok).toBe(true)
  return (await response.json()) as GraphqlErrorResponse
}

describe('formatError HTTP smoke', () => {
  let serverProcess: ChildProcess

  beforeAll(async () => {
    const server = await startSmokeServer(backendRoot)
    graphqlUrl = server.graphqlUrl
    serverProcess = server.serverProcess
  }, 60_000)

  afterAll(() => {
    stopSmokeServer(serverProcess)
  })

  it('retorna UNAUTHORIZED ao consultar me sem token, sem stacktrace', async () => {
    const result = await postGraphql(ME_QUERY)

    expectGraphqlError(
      result.errors?.[0],
      DOMAIN_ERRORS.unauthenticated,
      DOMAIN_ERROR_CODES.UNAUTHORIZED,
    )
    expect(result.errors?.[0]?.extensions?.stacktrace).toBeUndefined()
  })
})
