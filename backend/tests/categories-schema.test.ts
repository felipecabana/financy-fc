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

describe('categories GraphQL schema', () => {
  it('compila o SDL e expõe operações CRUD com tipos e inputs esperados', () => {
    const sdl = [
      loadModuleSchema('categories/schema.gql'),
      'type Query { _schemaValidation: Boolean }',
      'type Mutation { _schemaValidation: Boolean }',
    ].join('\n')

    const schema = buildSchema(sdl)
    const queryFields = schema.getQueryType()?.getFields()
    const mutationFields = schema.getMutationType()?.getFields()
    const categoryType = schema.getType('Category')
    const createInput = schema.getType('CreateCategoryInput')
    const updateInput = schema.getType('UpdateCategoryInput')

    expect(queryFields?.listCategories).toBeDefined()
    expect(queryFields?.getCategory).toBeDefined()
    expect(mutationFields?.createCategory).toBeDefined()
    expect(mutationFields?.updateCategory).toBeDefined()
    expect(mutationFields?.deleteCategory).toBeDefined()
    expect(isObjectType(categoryType)).toBe(true)
    expect(isInputObjectType(createInput)).toBe(true)
    expect(isInputObjectType(updateInput)).toBe(true)

    if (!isObjectType(categoryType)) {
      throw new Error('Category type not found')
    }

    const categoryFields = Object.keys(categoryType.getFields()).sort()
    expect(categoryFields).toEqual(['createdAt', 'id', 'name', 'updatedAt', 'userId'])
  })
})
