import { describe, expect, it } from 'vitest'

import { buildContext, env } from '../src/config/index.js'

describe('config barrel', () => {
  it('expõe env e buildContext pelo index central', () => {
    expect(env.JWT_SECRET).toBeTypeOf('string')
    expect(buildContext).toBeTypeOf('function')
  })
})
