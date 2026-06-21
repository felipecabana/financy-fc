import { describe, expect, it } from 'vitest'

import { buildContext, env, formatError } from '../src/config/index.js'

describe('config barrel', () => {
  it('expõe env, buildContext e formatError pelo index central', () => {
    expect(env.JWT_SECRET).toBeTypeOf('string')
    expect(buildContext).toBeTypeOf('function')
    expect(formatError).toBeTypeOf('function')
  })
})
