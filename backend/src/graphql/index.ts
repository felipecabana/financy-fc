import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import authResolvers from './modules/auth/resolvers.js'
import categoriesResolvers from './modules/categories/resolvers.js'
import usersResolvers from './modules/users/resolvers.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const loadSchema = (relativePath: string) =>
  readFileSync(path.join(__dirname, relativePath), 'utf-8')

export const typeDefs = `#graphql
  type Query {
    _health: String!
  }

  ${loadSchema('./modules/users/schema.gql')}
  ${loadSchema('./modules/auth/schema.gql')}
  ${loadSchema('./modules/categories/schema.gql')}
`

export const resolvers = {
  Query: {
    _health: () => 'ok',
    ...usersResolvers.Query,
    ...categoriesResolvers.Query,
  },
  Mutation: {
    ...authResolvers.Mutation,
    ...categoriesResolvers.Mutation,
  },
  Category: categoriesResolvers.Category,
}
