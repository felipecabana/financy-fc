// Smoke HTTP: prova que src/index.ts liga formatError no servidor real.
import { type ChildProcess, spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import {
  DOMAIN_ERROR_CODES,
  DOMAIN_ERRORS,
  expectGraphqlError,
} from './helpers/domain-error-assertions.js'

const ME_QUERY = `query { me { id email } }`

type GraphqlErrorResponse = {
  errors?: Array<{
    message: string
    extensions?: { code?: string; stacktrace?: string[] }
  }>
}

const backendRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const smokePort = 4103
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
    serverProcess = spawn('npx', ['tsx', 'src/index.ts'], {
      cwd: backendRoot,
      env: { ...process.env, PORT: String(smokePort) },
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true,
    })

    await waitForServer(serverProcess)
  }, 60_000)

  afterAll(() => {
    if (!serverProcess.killed) {
      serverProcess.kill()
    }
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
