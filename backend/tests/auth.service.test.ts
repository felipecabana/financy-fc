import { afterEach, describe, expect, it } from 'vitest'

import { prismaClient } from '../prisma/prisma.js'
import { verifyPassword } from '../src/helpers/password.js'
import authService from '../src/services/auth.service.js'
import {
  AUTH_ERRORS,
  createEmailCleanup,
  expectValidAuthPayload,
  TEST_PASSWORD,
  uniqueEmail,
} from './helpers/auth-test-utils.js'

describe('auth service', () => {
  const cleanup = createEmailCleanup()

  afterEach(async () => {
    await cleanup.reset()
  })

  it('signup cria usuário com senha hasheada e retorna token com dados públicos', async () => {
    const email = uniqueEmail('auth-service')
    cleanup.track(email)

    const result = await authService.signup({ email, password: TEST_PASSWORD })

    expect(result.user).toEqual({
      id: expect.any(String),
      email,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    })
    expectValidAuthPayload(result, email)

    const stored = await prismaClient.user.findUnique({ where: { email } })
    expect(stored?.password).not.toBe(TEST_PASSWORD)
    await expect(verifyPassword(TEST_PASSWORD, stored!.password)).resolves.toBe(true)
  })

  it('signup rejeita email duplicado', async () => {
    const email = uniqueEmail('auth-service')
    cleanup.track(email)

    await authService.signup({ email, password: TEST_PASSWORD })

    await expect(authService.signup({ email, password: 'other-password' })).rejects.toThrow(
      AUTH_ERRORS.duplicateEmail,
    )
  })

  it('signup rejeita campos obrigatórios ausentes', async () => {
    await expect(authService.signup({ email: '', password: TEST_PASSWORD })).rejects.toThrow(
      AUTH_ERRORS.requiredFields,
    )
    await expect(authService.signup({ email: 'user@example.com', password: '' })).rejects.toThrow(
      AUTH_ERRORS.requiredFields,
    )
  })

  it('login retorna token e usuário público com credenciais válidas', async () => {
    const email = uniqueEmail('auth-service')
    cleanup.track(email)

    await authService.signup({ email, password: TEST_PASSWORD })
    const result = await authService.login({ email, password: TEST_PASSWORD })

    expectValidAuthPayload(result, email)
  })

  it('login rejeita credenciais inválidas sem revelar se o email existe', async () => {
    const email = uniqueEmail('auth-service')
    cleanup.track(email)

    await authService.signup({ email, password: TEST_PASSWORD })

    await expect(
      authService.login({ email: 'missing@example.com', password: TEST_PASSWORD }),
    ).rejects.toThrow(AUTH_ERRORS.invalidCredentials)
    await expect(authService.login({ email, password: 'wrong-password' })).rejects.toThrow(
      AUTH_ERRORS.invalidCredentials,
    )
  })
})
