// Smoke HTTP: sobe o servidor real e valida mutations via POST /graphql.
import { type ChildProcess } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import {
  AUTH_COOKIE_NAME,
  createEmailCleanup,
  expectHttpAuthCookie,
  expectHttpAuthCookieCleared,
  expectValidAuthPayload,
  LOGIN_MUTATION,
  LOGOUT_MUTATION,
  ME_QUERY,
  UPDATE_USER_MUTATION,
  readSessionCookieHeader,
  SIGNUP_MUTATION,
  signupData,
  TEST_PASSWORD,
  uniqueEmail,
  type LoginResponse,
  type SignupResponse,
} from './helpers/auth-test-utils.js'
import {
  DOMAIN_ERROR_CODES,
  DOMAIN_ERRORS,
  expectGraphqlError,
} from './helpers/domain-error-assertions.js'
import { startSmokeServer, stopSmokeServer } from './helpers/smoke-server.js'

const backendRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
let graphqlUrl: string

async function postGraphql<T>(
  query: string,
  variables?: Record<string, unknown>,
  cookie?: string,
) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (cookie) headers.Cookie = cookie.includes('=') ? cookie : `${AUTH_COOKIE_NAME}=${cookie}`

  const response = await fetch(graphqlUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  })

  expect(response.ok).toBe(true)
  return { body: (await response.json()) as T, headers: response.headers }
}

describe('auth HTTP smoke', () => {
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

  it('signup retorna usuário público e seta cookie HttpOnly', async () => {
    const email = uniqueEmail('http-smoke')
    cleanup.track(email)

    const { body: result, headers } = await postGraphql<SignupResponse>(SIGNUP_MUTATION, {
      data: signupData(email),
    })

    expect(result.errors).toBeUndefined()
    expectValidAuthPayload(result.data!.signup, email)
    expectHttpAuthCookie(headers)
  })

  it('login retorna usuário público e seta cookie HttpOnly', async () => {
    const email = uniqueEmail('http-smoke')
    cleanup.track(email)

    await postGraphql<SignupResponse>(SIGNUP_MUTATION, {
      data: signupData(email),
    })

    const { body: result, headers } = await postGraphql<LoginResponse>(LOGIN_MUTATION, {
      data: { email, password: TEST_PASSWORD },
    })

    expect(result.errors).toBeUndefined()
    expectValidAuthPayload(result.data!.login, email)
    expectHttpAuthCookie(headers)
  })

  it('signup rejeita email duplicado', async () => {
    const email = uniqueEmail('http-smoke')
    cleanup.track(email)

    await postGraphql<SignupResponse>(SIGNUP_MUTATION, {
      data: signupData(email),
    })

    const { body: result } = await postGraphql<SignupResponse>(SIGNUP_MUTATION, {
      data: signupData(email, 'other-password'),
    })

    expect(result.data?.signup).toBeUndefined()
    expectGraphqlError(
      result.errors?.[0],
      DOMAIN_ERRORS.duplicateEmail,
      DOMAIN_ERROR_CODES.FORBIDDEN,
    )
  })

  it('login rejeita credenciais inválidas sem revelar se o email existe', async () => {
    const email = uniqueEmail('http-smoke')
    cleanup.track(email)

    await postGraphql<SignupResponse>(SIGNUP_MUTATION, {
      data: signupData(email),
    })

    const { body: missingEmail } = await postGraphql<LoginResponse>(LOGIN_MUTATION, {
      data: { email: 'missing@example.com', password: TEST_PASSWORD },
    })

    const { body: wrongPassword } = await postGraphql<LoginResponse>(LOGIN_MUTATION, {
      data: { email, password: 'wrong-password' },
    })

    expect(missingEmail.data?.login).toBeUndefined()
    expect(wrongPassword.data?.login).toBeUndefined()
    expectGraphqlError(
      missingEmail.errors?.[0],
      DOMAIN_ERRORS.invalidCredentials,
      DOMAIN_ERROR_CODES.UNAUTHORIZED,
    )
    expectGraphqlError(
      wrongPassword.errors?.[0],
      DOMAIN_ERRORS.invalidCredentials,
      DOMAIN_ERROR_CODES.UNAUTHORIZED,
    )
  })

  it('me autentica via cookie sem Bearer', async () => {
    const email = uniqueEmail('http-smoke')
    cleanup.track(email)

    const { headers: signupHeaders } = await postGraphql<SignupResponse>(SIGNUP_MUTATION, {
      data: signupData(email),
    })
    const cookieHeader = readSessionCookieHeader(signupHeaders)

    const { body: meResult } = await postGraphql<{ data?: { me: { id: string; email: string } } }>(
      ME_QUERY,
      undefined,
      cookieHeader,
    )

    expect(meResult.errors).toBeUndefined()
    expect(meResult.data?.me.email).toBe(email)
  })

  it('updateUser altera nome e me reflete a mudança', async () => {
    const email = uniqueEmail('http-smoke')
    cleanup.track(email)

    const { headers: signupHeaders } = await postGraphql<SignupResponse>(SIGNUP_MUTATION, {
      data: signupData(email),
    })
    const cookieHeader = readSessionCookieHeader(signupHeaders)

    const { body: updateResult } = await postGraphql<{
      data?: { updateUser: { name: string; email: string } }
    }>(
      UPDATE_USER_MUTATION,
      { data: { name: 'Conta Atualizada' } },
      cookieHeader,
    )

    expect(updateResult.errors).toBeUndefined()
    expect(updateResult.data?.updateUser.name).toBe('Conta Atualizada')
    expect(updateResult.data?.updateUser.email).toBe(email)

    const { body: meResult } = await postGraphql<{
      data?: { me: { name: string; email: string } }
    }>(ME_QUERY, undefined, cookieHeader)

    expect(meResult.data?.me.name).toBe('Conta Atualizada')
  })

  it('logout limpa cookie de sessão', async () => {
    const email = uniqueEmail('http-smoke')
    cleanup.track(email)

    const { headers: signupHeaders } = await postGraphql<SignupResponse>(SIGNUP_MUTATION, {
      data: signupData(email),
    })
    const cookieHeader = readSessionCookieHeader(signupHeaders)

    const { body: logoutResult, headers: logoutHeaders } = await postGraphql<{
      data?: { logout: boolean }
    }>(LOGOUT_MUTATION, undefined, cookieHeader)

    expect(logoutResult.data?.logout).toBe(true)
    expectHttpAuthCookieCleared(logoutHeaders)
  })

  it('me rejeita após logout sem cookie de sessão', async () => {
    const email = uniqueEmail('http-smoke')
    cleanup.track(email)

    const { headers: signupHeaders } = await postGraphql<SignupResponse>(SIGNUP_MUTATION, {
      data: signupData(email),
    })
    const cookieHeader = readSessionCookieHeader(signupHeaders)

    await postGraphql<{ data?: { logout: boolean } }>(LOGOUT_MUTATION, undefined, cookieHeader)

    const { body: meResult } = await postGraphql<{ data?: { me: { email: string } } }>(ME_QUERY)

    expect(meResult.data?.me).toBeUndefined()
    expectGraphqlError(
      meResult.errors?.[0],
      DOMAIN_ERRORS.unauthenticated,
      DOMAIN_ERROR_CODES.UNAUTHORIZED,
    )
  })
})
