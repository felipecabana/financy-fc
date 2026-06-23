import type { Response } from 'express'
import { describe, expect, it, vi } from 'vitest'

import {
  AUTH_COOKIE_NAME,
  getAuthCookieOptions,
  setAuthCookie,
  clearAuthCookie,
} from '../src/helpers/auth-cookie.js'

describe('auth-cookie helpers', () => {
  it('getAuthCookieOptions usa httpOnly, sameSite lax e maxAge de 1 dia', () => {
    const options = getAuthCookieOptions()

    expect(options.httpOnly).toBe(true)
    expect(options.sameSite).toBe('lax')
    expect(options.maxAge).toBe(24 * 60 * 60 * 1000)
    expect(options.path).toBe('/')
  })

  it('getAuthCookieOptions usa secure somente em produção', () => {
    const originalNodeEnv = process.env.NODE_ENV

    process.env.NODE_ENV = 'production'
    expect(getAuthCookieOptions().secure).toBe(true)

    process.env.NODE_ENV = 'test'
    expect(getAuthCookieOptions().secure).toBe(false)

    process.env.NODE_ENV = originalNodeEnv
  })

  it('setAuthCookie delega para res.cookie com nome e opções corretas', () => {
    const res = { cookie: vi.fn() } as unknown as Response

    setAuthCookie(res, 'jwt-token')

    expect(res.cookie).toHaveBeenCalledWith(AUTH_COOKIE_NAME, 'jwt-token', getAuthCookieOptions())
  })

  it('clearAuthCookie delega para res.clearCookie com nome e opções corretas', () => {
    const res = { clearCookie: vi.fn() } as unknown as Response

    clearAuthCookie(res)

    expect(res.clearCookie).toHaveBeenCalledWith(AUTH_COOKIE_NAME, getAuthCookieOptions())
  })
})
