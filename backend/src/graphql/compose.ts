import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { loadFilesSync } from '@graphql-tools/load-files'
import { mergeResolvers, mergeTypeDefs } from '@graphql-tools/merge'

import authResolvers from './modules/auth/resolvers.js'
import categoriesResolvers from './modules/categories/resolvers.js'
import transactionsResolvers from './modules/transactions/resolvers.js'
import usersResolvers from './modules/users/resolvers.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const typesArray = loadFilesSync(
  [path.join(__dirname, './schema'), path.join(__dirname, './modules')],
  { extensions: ['gql'], recursive: true },
)

export const typeDefs = mergeTypeDefs(typesArray)

export const resolvers = mergeResolvers([
  { Query: { _health: () => 'ok' } },
  authResolvers,
  usersResolvers,
  categoriesResolvers,
  transactionsResolvers,
])

export const graphql = { typeDefs, resolvers }
