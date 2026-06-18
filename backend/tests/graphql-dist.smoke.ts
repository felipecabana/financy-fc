import { existsSync } from 'node:fs'
import path from 'node:path'
import { type ChildProcess, spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const backendRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const smokePort = 4097
const graphqlUrl = `http://127.0.0.1:${smokePort}/graphql`

const distGqlPaths = [
  'dist/src/graphql/schema/base.gql',
  'dist/src/graphql/modules/auth/schema.gql',
  'dist/src/graphql/modules/users/schema.gql',
  'dist/src/graphql/modules/categories/schema.gql',
  'dist/src/graphql/modules/transactions/schema.gql',
]

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

describe('graphql dist smoke', () => {
  let serverProcess: ChildProcess

  beforeAll(() => {
    for (const relativePath of distGqlPaths) {
      expect(existsSync(path.join(backendRoot, relativePath))).toBe(true)
    }
  })

  beforeAll(async () => {
    serverProcess = spawn('node', ['dist/src/index.js'], {
      cwd: backendRoot,
      env: { ...process.env, PORT: String(smokePort) },
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true,
    })

    await waitForServer(serverProcess)
  }, 60_000)

  afterAll(() => {
    if (serverProcess && !serverProcess.killed) {
      serverProcess.kill()
    }
  })

  it('npm start responde _health com SDL carregado de dist', async () => {
    const response = await fetch(graphqlUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: '{ _health }' }),
    })

    expect(response.ok).toBe(true)

    const body = (await response.json()) as { data?: { _health?: string } }
    expect(body.data?._health).toBe('ok')
  })
})
