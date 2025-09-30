import { Amplify } from 'aws-amplify';
import { createApp } from 'vue';
import App from './App.vue';



// Environment-specific AppSync endpoints from environment variables
const environments = {
  dev: {
    environment: 'dev',
    graphqlUrl: import.meta.env.VITE_DEV_GRAPHQL_URL,
    region: import.meta.env.VITE_APPSYNC_REGION,
    userPoolId: import.meta.env.VITE_USER_POOL_ID,
    userPoolClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID,
    oauthDomain: import.meta.env.VITE_OAUTH_DOMAIN
  },
  test: {
    environment: 'test',
    graphqlUrl: import.meta.env.VITE_TEST_GRAPHQL_URL,
    region: import.meta.env.VITE_APPSYNC_REGION,
    userPoolId: import.meta.env.VITE_USER_POOL_ID,
    userPoolClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID,
    oauthDomain: import.meta.env.VITE_OAUTH_DOMAIN
  },
  uat: {
    environment: 'uat',
    graphqlUrl: import.meta.env.VITE_UAT_GRAPHQL_URL,
    region: import.meta.env.VITE_APPSYNC_REGION,
    userPoolId: import.meta.env.VITE_USER_POOL_ID,
    userPoolClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID,
    oauthDomain: import.meta.env.VITE_OAUTH_DOMAIN
  },
  live: {
    environment: 'live',
    graphqlUrl: import.meta.env.VITE_LIVE_GRAPHQL_URL,
    region: import.meta.env.VITE_APPSYNC_REGION,
    userPoolId: import.meta.env.VITE_USER_POOL_ID,
    userPoolClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID,
    oauthDomain: import.meta.env.VITE_OAUTH_DOMAIN
  }
};

// Global environment state
window.currentEnvironment = localStorage.getItem('selectedEnvironment') || 'dev';
window.compareEnvironment = localStorage.getItem('compareEnvironment') || '';
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

// Configure Amplify with current environment
const currentEnv = environments[window.currentEnvironment];
const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: currentEnv.userPoolId,
      userPoolClientId: currentEnv.userPoolClientId,
      region: currentEnv.region
    }
  },
  API: {
    GraphQL: {
      endpoint: currentEnv.graphqlUrl,
      region: currentEnv.region,
      defaultAuthMode: 'userPool'
    }
  }
};

Amplify.configure(amplifyConfig);

// Global function to switch environments and reconfigure Amplify
window.switchEnvironment = (envKey) => {
  window.currentEnvironment = envKey;
  localStorage.setItem('selectedEnvironment', envKey);
  
  // Reconfigure Amplify with new environment
  const newEnv = environments[envKey];
  const newConfig = {
    Auth: {
      Cognito: {
        userPoolId: newEnv.userPoolId,
        userPoolClientId: newEnv.userPoolClientId,
        region: newEnv.region
      }
    },
    API: {
      GraphQL: {
        endpoint: newEnv.graphqlUrl,
        region: newEnv.region,
        defaultAuthMode: 'userPool'
      }
    }
  };
  
  Amplify.configure(newConfig);
  
  // Dispatch custom event to notify components
  window.dispatchEvent(new CustomEvent('environmentChanged', { detail: { environment: envKey } }));
};

// Create and mount Vue app
createApp(App).mount('#app');