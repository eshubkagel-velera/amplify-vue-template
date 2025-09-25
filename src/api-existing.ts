import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client/core'

const httpLink = createHttpLink({
  uri: 'https://your-existing-appsync-api.appsync-api.us-east-2.amazonaws.com/graphql',
  headers: {
    'x-api-key': 'your-existing-api-key'
  }
})

export const apolloClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache()
})