import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client/core'

console.log('GraphQL URL:', import.meta.env.VITE_GRAPHQL_URL)
console.log('API Key:', import.meta.env.VITE_API_KEY)

const httpLink = createHttpLink({
  uri: import.meta.env.VITE_GRAPHQL_URL,
  headers: {
    'x-api-key': import.meta.env.VITE_API_KEY
  }
})

export const apolloClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache()
})