import { ApolloClient, ApolloLink, HttpLink, InMemoryCache } from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import { useAuthStore } from '@/stores/auth'

export const backendGraphQLUrl =
  import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000/graphql'

const httpLink = new HttpLink({
  uri: backendGraphQLUrl,
})

const authLink = setContext((_, prevContext) => {
  const token = useAuthStore.getState().token
  return {
    headers: {
      ...prevContext.headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  }
})

export const apolloClient = new ApolloClient({
  link: ApolloLink.from([authLink, httpLink]),
  cache: new InMemoryCache(),
})
