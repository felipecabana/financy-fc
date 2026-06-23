import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildSchema, isInputObjectType, isObjectType } from 'graphql'
import { describe, expect, it } from 'vitest'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const modulesDir = path.join(__dirname, '../src/graphql/modules')

function loadModuleSchema(...relativePaths: string[]) {
  return relativePaths
    .map((relativePath) => readFileSync(path.join(modulesDir, relativePath), 'utf-8'))
    .join('\n')
}

describe('auth GraphQL schema', () => {
  it('compila o schema e expõe mutations signup/login com campos mínimos de User', () => {
    const sdl = [
      loadModuleSchema('users/schema.gql', 'auth/schema.gql'),
      'type Query { _schemaValidation: Boolean }',
    ].join('\n')

    const schema = buildSchema(sdl)
    const mutationFields = schema.getMutationType()?.getFields()
    const userType = schema.getType('User')

    expect(mutationFields?.signup).toBeDefined()
    expect(mutationFields?.login).toBeDefined()
    expect(isObjectType(userType)).toBe(true)

    if (!isObjectType(userType)) {
      throw new Error('User type not found')
    }

    const userFields = Object.keys(userType.getFields()).sort()
    expect(userFields).toEqual(['createdAt', 'email', 'id', 'name', 'updatedAt'])

    const signupInput = schema.getType('SignupInput')
    expect(isInputObjectType(signupInput)).toBe(true)
    if (!isInputObjectType(signupInput)) {
      throw new Error('SignupInput type not found')
    }

    expect(Object.keys(signupInput.getFields()).sort()).toEqual(['email', 'name', 'password'])
  })
})
