import { describe, expect, it } from 'vitest'
import { cn } from '@/lib/utils'

describe('scaffold', () => {
  it('executa o vitest', () => {
    expect(true).toBe(true)
  })

  it('resolve o alias de path @/', () => {
    expect(cn('a', false, 'b')).toBe('a b')
  })
})
