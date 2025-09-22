import { Amplify } from 'aws-amplify';
import { createApp } from 'vue';
import App from './App.vue';

console.log('🚀 Starting GraphQL API Manager');

// Simple environment configuration - no API keys needed in frontend
const environments = {
  dev: {
    environment: 'dev',
    region: import.meta.env.VITE_APPSYNC_REGION || 'us-east-2',
    userPoolId: import.meta.env.VITE_USER_POOL_ID,
    userPoolClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID,
    oauthDomain: import.meta.env.VITE_OAUTH_DOMAIN
  },
  test: {
    environment: 'test',
    region: import.meta.env.VITE_APPSYNC_REGION || 'us-east-2',
    userPoolId: import.meta.env.VITE_USER_POOL_ID,
    userPoolClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID,
    oauthDomain: import.meta.env.VITE_OAUTH_DOMAIN
  },
  uat: {
    endpoint: import.meta.env.VITE_UAT_APPSYNC_ENDPOINT,
    appId: import.meta.env.VITE_UAT_APPSYNC_API_ID,
    apiKey: import.meta.env.VITE_UAT_APPSYNC_API_KEY,
    region: import.meta.env.VITE_APPSYNC_REGION || 'us-east-2',
    environment: 'uat',
    userPoolId: import.meta.env.VITE_USER_POOL_ID,
    userPoolClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID,
    oauthDomain: import.meta.env.VITE_OAUTH_DOMAIN
  },
  prod: {
    endpoint: import.meta.env.VITE_PROD_APPSYNC_ENDPOINT,
    appId: import.meta.env.VITE_PROD_APPSYNC_API_ID,
    apiKey: import.meta.env.VITE_PROD_APPSYNC_API_KEY,
    region: import.meta.env.VITE_APPSYNC_REGION || 'us-east-2',
    environment: 'prod',
    userPoolId: import.meta.env.VITE_USER_POOL_ID,
    userPoolClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID,
    oauthDomain: import.meta.env.VITE_OAUTH_DOMAIN
  }
};

// Global environment state
window.currentEnvironment = localStorage.getItem('selectedEnvironment') || 'dev';
window.environments = environments;

// Validate required environment variables
const userPoolId = import.meta.env.VITE_USER_POOL_ID;
const userPoolClientId = import.meta.env.VITE_USER_POOL_CLIENT_ID;

if (!userPoolId) {
  throw new Error('VITE_USER_POOL_ID environment variable is required');
}
if (!userPoolClientId) {
  throw new Error('VITE_USER_POOL_CLIENT_ID environment variable is required');
}

// Configure Amplify with minimal config since backend deployment failed
const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId,
      userPoolClientId,
      region: import.meta.env.VITE_APPSYNC_REGION || 'us-east-2',
      loginWith: {
        oauth: {
          domain: import.meta.env.VITE_OAUTH_DOMAIN,
          scopes: ['email', 'openid', 'profile'],
          redirectSignIn: [window.location.origin + '/'],
          redirectSignOut: [window.location.origin + '/'],
          responseType: 'code'
        }
      }
    }
  },
  API: {
    GraphQL: {
      endpoint: 'https://placeholder.appsync-api.us-east-2.amazonaws.com/graphql',
      region: import.meta.env.VITE_APPSYNC_REGION || 'us-east-2',
      defaultAuthMode: 'apiKey',
      apiKey: 'placeholder-key'
    }
  }
};

Amplify.configure(amplifyConfig);
console.log(`🌍 Amplify configured with minimal config`);



// Global function to switch environments (now just updates current environment)
window.switchEnvironment = (envKey) => {
  window.currentEnvironment = envKey;
  localStorage.setItem('selectedEnvironment', envKey);
  console.log(`✅ Switched to ${envKey} environment`);
};

console.log('✅ Amplify configured');

// Create and mount Vue app
createApp(App).mount('#app');
console.log('✅ App mounted');