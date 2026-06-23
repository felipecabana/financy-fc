import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client'

export const backendGraphQLUrl =
  import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000/graphql'

const httpLink = new HttpLink({
  uri: backendGraphQLUrl,
  credentials: 'include',
})

export const apolloClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
})
