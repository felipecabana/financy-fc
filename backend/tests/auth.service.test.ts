import { afterEach, describe, expect, it } from 'vitest'

import { prismaClient } from '../prisma/prisma.js'
import { verifyPassword } from '../src/helpers/password.js'
import authService from '../src/services/auth.service.js'
import {
  createEmailCleanup,
  expectValidAuthPayload,
  TEST_PASSWORD,
  uniqueEmail,
} from './helpers/auth-test-utils.js'
import {
  DOMAIN_ERROR_CODES,
  DOMAIN_ERRORS,
  expectDomainError,
} from './helpers/domain-error-assertions.js'

const TEST_NAME = 'Maria Silva'

describe('auth service', () => {
  const cleanup = createEmailCleanup()

  afterEach(async () => {
    await cleanup.reset()
  })

  it('signup cria usuário com senha hasheada e retorna token com dados públicos', async () => {
    const email = uniqueEmail('auth-service')
    cleanup.track(email)

    const result = await authService.signup({ name: TEST_NAME, email, password: TEST_PASSWORD })

    expect(result.user).toEqual({
      id: expect.any(String),
      name: TEST_NAME,
      email,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    })
    expectValidAuthPayload(result, email)

    const stored = await prismaClient.user.findUnique({ where: { email } })
    expect(stored?.name).toBe(TEST_NAME)
    expect(stored?.password).not.toBe(TEST_PASSWORD)
    await expect(verifyPassword(TEST_PASSWORD, stored!.password)).resolves.toBe(true)
  })

  it('signup rejeita email duplicado', async () => {
    const email = uniqueEmail('auth-service')
    cleanup.track(email)

    await authService.signup({ name: TEST_NAME, email, password: TEST_PASSWORD })

    await expectDomainError(
      authService.signup({ name: 'Outro Nome', email, password: 'other-password' }),
      DOMAIN_ERRORS.duplicateEmail,
      DOMAIN_ERROR_CODES.FORBIDDEN,
    )
  })

  it('signup rejeita campos obrigatórios ausentes', async () => {
    await expectDomainError(
      authService.signup({ name: '', email: 'user@example.com', password: TEST_PASSWORD }),
      'Nome, email e senha são obrigatórios.',
      DOMAIN_ERROR_CODES.UNAUTHORIZED,
    )
    await expectDomainError(
      authService.signup({ name: TEST_NAME, email: '', password: TEST_PASSWORD }),
      'Nome, email e senha são obrigatórios.',
      DOMAIN_ERROR_CODES.UNAUTHORIZED,
    )
    await expectDomainError(
      authService.signup({ name: TEST_NAME, email: 'user@example.com', password: '' }),
      'Nome, email e senha são obrigatórios.',
      DOMAIN_ERROR_CODES.UNAUTHORIZED,
    )
  })

  it('login retorna token e usuário público com credenciais válidas', async () => {
    const email = uniqueEmail('auth-service')
    cleanup.track(email)

    await authService.signup({ name: TEST_NAME, email, password: TEST_PASSWORD })
    const result = await authService.login({ email, password: TEST_PASSWORD })

    expectValidAuthPayload(result, email)
    expect(result.user.name).toBe(TEST_NAME)
  })

  it('login rejeita credenciais inválidas sem revelar se o email existe', async () => {
    const email = uniqueEmail('auth-service')
    cleanup.track(email)

    await authService.signup({ name: TEST_NAME, email, password: TEST_PASSWORD })

    await expectDomainError(
      authService.login({ email: 'missing@example.com', password: TEST_PASSWORD }),
      DOMAIN_ERRORS.invalidCredentials,
      DOMAIN_ERROR_CODES.UNAUTHORIZED,
    )
    await expectDomainError(
      authService.login({ email, password: 'wrong-password' }),
      DOMAIN_ERRORS.invalidCredentials,
      DOMAIN_ERROR_CODES.UNAUTHORIZED,
    )
  })
})
