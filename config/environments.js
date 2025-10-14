export const environments = {
  dev: {
    appSyncUrl: 'https://your-dev-appsync-id.appsync.us-east-2.amazonaws.com/graphql',
    cognitoUserPoolId: 'us-east-2_DevPoolId',
    cognitoClientId: 'dev-client-id'
  },
  test: {
    appSyncUrl: 'https://your-test-appsync-id.appsync.us-east-2.amazonaws.com/graphql',
    cognitoUserPoolId: 'us-east-2_TestPoolId', 
    cognitoClientId: 'test-client-id'
  },
  prod: {
    appSyncUrl: 'https://your-prod-appsync-id.appsync.us-east-2.amazonaws.com/graphql',
    cognitoUserPoolId: 'us-east-2_ProdPoolId',
    cognitoClientId: 'prod-client-id'
  }
};