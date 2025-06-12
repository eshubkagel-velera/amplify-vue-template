import { Amplify } from 'aws-amplify';

// Configure Amplify to use the AppSync API with environment variables
Amplify.configure({
  API: {
    GraphQL: {
      endpoint: 'https://fi5pjed64nf4ran34tusrlvi7u.appsync-api.us-east-2.amazonaws.com/graphql',
      region: 'us-east-2',
      defaultAuthMode: 'apiKey',
      apiKey: 'da2-qfwm2qhugrbilizrqickmeg5oi'
    }
  }
});