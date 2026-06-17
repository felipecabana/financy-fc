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

describe('transactions GraphQL schema', () => {
  it('compila o SDL e expõe operações CRUD com tipos e inputs esperados', () => {
    const sdl = [
      loadModuleSchema('categories/schema.gql', 'transactions/schema.gql'),
      'type Query { _schemaValidation: Boolean }',
      'type Mutation { _schemaValidation: Boolean }',
    ].join('\n')

    const schema = buildSchema(sdl)
    const queryFields = schema.getQueryType()?.getFields()
    const mutationFields = schema.getMutationType()?.getFields()
    const transactionType = schema.getType('Transaction')
    const createInput = schema.getType('CreateTransactionInput')
    const updateInput = schema.getType('UpdateTransactionInput')

    expect(queryFields?.listTransactions).toBeDefined()
    expect(queryFields?.getTransaction).toBeDefined()
    expect(mutationFields?.createTransaction).toBeDefined()
    expect(mutationFields?.updateTransaction).toBeDefined()
    expect(mutationFields?.deleteTransaction).toBeDefined()
    expect(isObjectType(transactionType)).toBe(true)
    expect(isInputObjectType(createInput)).toBe(true)
    expect(isInputObjectType(updateInput)).toBe(true)

    if (!isObjectType(transactionType)) {
      throw new Error('Transaction type not found')
    }

    const transactionFields = Object.keys(transactionType.getFields()).sort()
    expect(transactionFields).toEqual([
      'amount',
      'category',
      'categoryId',
      'createdAt',
      'id',
      'title',
      'type',
      'updatedAt',
      'userId',
    ])
  })
})
