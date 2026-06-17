export const typeDefs = `#graphql
  type Query {
    _health: String!
  }
`

export const resolvers = {
  Query: {
    _health: () => 'ok',
  },
}
