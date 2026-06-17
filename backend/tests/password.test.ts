import { describe, expect, it } from 'vitest'

import { hashPassword, verifyPassword } from '../src/helpers/password.js'

describe('password helpers', () => {
  it('hashPassword retorna um hash diferente da senha em texto', async () => {
    const password = 'my-secret-password'
    const hash = await hashPassword(password)

    expect(hash).not.toBe(password)
    expect(hash.length).toBeGreaterThan(0)
  })

  it('verifyPassword retorna true para a senha correta', async () => {
    const password = 'correct-password'
    const hash = await hashPassword(password)

    await expect(verifyPassword(password, hash)).resolves.toBe(true)
  })

  it('verifyPassword retorna false para a senha incorreta', async () => {
    const hash = await hashPassword('correct-password')

    await expect(verifyPassword('wrong-password', hash)).resolves.toBe(false)
  })
})
