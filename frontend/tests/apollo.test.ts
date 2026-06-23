import { ApolloLink, gql, HttpLink } from '@apollo/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { apolloClient } from '@/lib/graphql/apollo'

const defaultBackendUrl = 'http://localhost:4000/graphql'

function mockGraphQLResponse() {
  return vi.fn().mockResolvedValue(
    new Response(JSON.stringify({ data: { __typename: 'Query' } }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }),
  )
}

async function runLinkQuery(link: ApolloLink) {
  return new Promise<{ data?: { __typename?: string } }>((resolve, reject) => {
    ApolloLink.execute(link, { query: gql`query { __typename }` }, { client: apolloClient }).subscribe({
      next: resolve,
      error: reject,
    })
  })
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe('graphql client', () => {
  it('resolve backendGraphQLUrl a partir de VITE_BACKEND_URL', async () => {
    vi.stubEnv('VITE_BACKEND_URL', 'http://custom.test/graphql')
    vi.resetModules()

    const { backendGraphQLUrl } = await import('@/lib/graphql/apollo')
    expect(backendGraphQLUrl).toBe('http://custom.test/graphql')
  })

  it('usa fallback local quando VITE_BACKEND_URL esta vazia', async () => {
    vi.stubEnv('VITE_BACKEND_URL', '')
    vi.resetModules()

    const { backendGraphQLUrl } = await import('@/lib/graphql/apollo')
    expect(backendGraphQLUrl).toBe(defaultBackendUrl)
  })

  it('envia requisicao graphql via HttpLink', async () => {
    const fetchMock = mockGraphQLResponse()
    const httpLink = new HttpLink({ uri: defaultBackendUrl, fetch: fetchMock })

    const result = await runLinkQuery(httpLink)

    expect(result.data?.__typename).toBe('Query')
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it('HttpLink com credentials include envia cookie na requisicao', async () => {
    const fetchMock = mockGraphQLResponse()
    const httpLink = new HttpLink({
      uri: defaultBackendUrl,
      fetch: fetchMock,
      credentials: 'include',
    })

    await runLinkQuery(httpLink)

    const [input, init] = fetchMock.mock.calls[0] ?? []
    const credentials =
      init?.credentials ?? (input instanceof Request ? input.credentials : undefined)

    expect(credentials).toBe('include')
  })
})
