import { buildASTSchema } from 'graphql'
import { describe, expect, it } from 'vitest'

import { graphql, resolvers, typeDefs } from '../src/graphql/index.js'

const expectedQueryFields = [
  '_health',
  'getCategory',
  'getTransaction',
  'listCategories',
  'listTransactions',
  'me',
]

const expectedMutationFields = [
  'createCategory',
  'createTransaction',
  'deleteCategory',
  'deleteTransaction',
  'login',
  'logout',
  'signup',
  'updateCategory',
  'updateTransaction',
  'updateUser',
]

describe('graphql composition', () => {
  it('mergeia o SDL com a superfície Query/Mutation esperada', () => {
    const schema = buildASTSchema(typeDefs)
    const queryFields = Object.keys(schema.getQueryType()?.getFields() ?? {}).sort()
    const mutationFields = Object.keys(schema.getMutationType()?.getFields() ?? {}).sort()

    expect(queryFields).toEqual(expectedQueryFields)
    expect(mutationFields).toEqual(expectedMutationFields)
  })

  it('mergeia resolvers com namespaces Query, Mutation, Category e Transaction', () => {
    const queryFields = Object.keys(resolvers.Query ?? {}).sort()
    const mutationFields = Object.keys(resolvers.Mutation ?? {}).sort()
    const typeResolvers = Object.keys(resolvers).filter(
      (key) => key !== 'Query' && key !== 'Mutation',
    )

    expect(queryFields).toEqual(expectedQueryFields)
    expect(mutationFields).toEqual(expectedMutationFields)
    expect(typeResolvers.sort()).toEqual(['Category', 'Transaction'])
  })

  it('exporta graphql com as mesmas referências de typeDefs e resolvers', () => {
    expect(graphql.typeDefs).toBe(typeDefs)
    expect(graphql.resolvers).toBe(resolvers)
  })
})
