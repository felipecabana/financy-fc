import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/graphql-dist.smoke.ts'],
  },
})
