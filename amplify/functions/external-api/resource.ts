import { defineFunction, secret } from '@aws-amplify/backend';

export const externalApi = defineFunction({
  name: 'external-api',
  environment: {
    DEV_APPSYNC_ENDPOINT: 'https://fi5pjed64nf4ran34tusrlvi7u.appsync-api.us-east-2.amazonaws.com/graphql',
    DEV_APPSYNC_API_KEY: secret('VITE_DEV_APPSYNC_API_KEY'),
    TEST_APPSYNC_ENDPOINT: 'https://duvqljupwfacli45hvfqoi3uni.appsync-api.us-east-2.amazonaws.com/graphql',
    TEST_APPSYNC_API_KEY: secret('VITE_TEST_APPSYNC_API_KEY'),
  }
});