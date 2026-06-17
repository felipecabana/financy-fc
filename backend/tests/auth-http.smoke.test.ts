// Smoke HTTP: sobe o servidor real e valida mutations via POST /graphql.
import { type ChildProcess, spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import {
  AUTH_ERRORS,
  createEmailCleanup,
  expectValidAuthPayload,
  LOGIN_MUTATION,
  SIGNUP_MUTATION,
  TEST_PASSWORD,
  uniqueEmail,
  type LoginResponse,
  type SignupResponse,
} from './helpers/auth-test-utils.js'

const backendRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const smokePort = 4098
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

async function postGraphql<T>(query: string, variables?: Record<string, unknown>) {
  const response = await fetch(graphqlUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  })

  expect(response.ok).toBe(true)
  return (await response.json()) as T
}

describe('auth HTTP smoke', () => {
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

    if (!serverProcess.killed) {
      serverProcess.kill()
    }
  })

  afterEach(async () => {
    await cleanup.reset()
  })

  it('signup retorna usuário público e token válido', async () => {
    const email = uniqueEmail('http-smoke')
    cleanup.track(email)

    const result = await postGraphql<SignupResponse>(SIGNUP_MUTATION, {
      data: { email, password: TEST_PASSWORD },
    })

    expect(result.errors).toBeUndefined()
    expectValidAuthPayload(result.data!.signup, email)
  })

  it('login retorna JWT com credenciais válidas', async () => {
    const email = uniqueEmail('http-smoke')
    cleanup.track(email)

    await postGraphql<SignupResponse>(SIGNUP_MUTATION, {
      data: { email, password: TEST_PASSWORD },
    })

    const result = await postGraphql<LoginResponse>(LOGIN_MUTATION, {
      data: { email, password: TEST_PASSWORD },
    })

    expect(result.errors).toBeUndefined()
    expectValidAuthPayload(result.data!.login, email)
  })

  it('signup rejeita email duplicado', async () => {
    const email = uniqueEmail('http-smoke')
    cleanup.track(email)

    await postGraphql<SignupResponse>(SIGNUP_MUTATION, {
      data: { email, password: TEST_PASSWORD },
    })

    const result = await postGraphql<SignupResponse>(SIGNUP_MUTATION, {
      data: { email, password: 'other-password' },
    })

    expect(result.data?.signup).toBeUndefined()
    expect(result.errors?.[0]?.message).toBe(AUTH_ERRORS.duplicateEmail)
  })

  it('login rejeita credenciais inválidas sem revelar se o email existe', async () => {
    const email = uniqueEmail('http-smoke')
    cleanup.track(email)

    await postGraphql<SignupResponse>(SIGNUP_MUTATION, {
      data: { email, password: TEST_PASSWORD },
    })

    const missingEmail = await postGraphql<LoginResponse>(LOGIN_MUTATION, {
      data: { email: 'missing@example.com', password: TEST_PASSWORD },
    })

    const wrongPassword = await postGraphql<LoginResponse>(LOGIN_MUTATION, {
      data: { email, password: 'wrong-password' },
    })

    expect(missingEmail.data?.login).toBeUndefined()
    expect(wrongPassword.data?.login).toBeUndefined()
    expect(missingEmail.errors?.[0]?.message).toBe(AUTH_ERRORS.invalidCredentials)
    expect(wrongPassword.errors?.[0]?.message).toBe(AUTH_ERRORS.invalidCredentials)
  })
})
