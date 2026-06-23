import type { CookieOptions, Response } from 'express'

export const AUTH_COOKIE_NAME = 'auth'

const ONE_DAY_MS = 24 * 60 * 60 * 1000 // 24 horas em milissegundos

export function getAuthCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: ONE_DAY_MS,
    path: '/',
  }
}

export function setAuthCookie(res: Response, token: string): void {
  res.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions())
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie(AUTH_COOKIE_NAME, getAuthCookieOptions())
}
