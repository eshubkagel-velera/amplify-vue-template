import { Amplify } from 'aws-amplify';
import { createApp } from 'vue';
import App from './App.vue';

console.log('🚀 Starting GraphQL API Manager');

// Build environment configuration from environment variables
const environments = {
  dev: {
    endpoint: import.meta.env.VITE_DEV_APPSYNC_ENDPOINT || import.meta.env.VITE_APPSYNC_API_URL,
    appId: import.meta.env.VITE_DEV_APPSYNC_API_ID || import.meta.env.VITE_APP_ID,
    apiKey: import.meta.env.VITE_DEV_APPSYNC_API_KEY || import.meta.env.VITE_APPSYNC_API_KEY,
    region: import.meta.env.VITE_APPSYNC_REGION || 'us-east-2',
    environment: 'dev',
    userPoolId: import.meta.env.VITE_USER_POOL_ID,
    userPoolClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID,
    oauthDomain: import.meta.env.VITE_OAUTH_DOMAIN
  },
  test: {
    endpoint: import.meta.env.VITE_TEST_APPSYNC_ENDPOINT || import.meta.env.VITE_APPSYNC_API_URL,
    appId: import.meta.env.VITE_TEST_APPSYNC_API_ID || import.meta.env.VITE_APP_ID,
    apiKey: import.meta.env.VITE_TEST_APPSYNC_API_KEY || import.meta.env.VITE_APPSYNC_API_KEY,
    region: import.meta.env.VITE_APPSYNC_REGION || 'us-east-2',
    environment: 'test',
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

// Configure Amplify with initial environment
const configureAmplify = (envKey) => {
  const config = environments[envKey];
  if (!config) {
    throw new Error(`Invalid environment: ${envKey}`);
  }
  
  console.log(`🌍 Configuring for environment: ${envKey}`);
  console.log('🔍 Environment variables:', {
    endpoint: config.endpoint,
    apiKey: config.apiKey ? `SET (${config.apiKey.substring(0, 8)}...)` : 'MISSING',
    allEnvVars: Object.keys(import.meta.env),
    devKey: import.meta.env.VITE_DEV_APPSYNC_API_KEY ? 'SET' : 'MISSING',
    testKey: import.meta.env.VITE_TEST_APPSYNC_API_KEY ? 'SET' : 'MISSING',
    uatKey: import.meta.env.VITE_UAT_APPSYNC_API_KEY ? 'SET' : 'MISSING',
    prodKey: import.meta.env.VITE_PROD_APPSYNC_API_KEY ? 'SET' : 'MISSING'
  });
  console.log('🔍 Full env vars:', import.meta.env);
  
  if (!config.apiKey) {
    console.error(`❌ No API key found for ${envKey} environment`);
    console.error('Available env vars:', Object.keys(import.meta.env));
  }
  
  const amplifyConfig = {
    API: {
      GraphQL: {
        endpoint: config.endpoint,
        region: config.region,
        defaultAuthMode: 'apiKey',
        apiKey: config.apiKey
      }
    }
  };
  
  // Add Auth config if available
  if (config.userPoolId && config.userPoolClientId) {
    amplifyConfig.Auth = {
      Cognito: {
        userPoolId: config.userPoolId,
        userPoolClientId: config.userPoolClientId,
        region: config.region,
        loginWith: {
          oauth: {
            domain: config.oauthDomain,
            scopes: ['email', 'openid', 'profile'],
            redirectSignIn: [window.location.origin + '/'],
            redirectSignOut: [window.location.origin + '/'],
            responseType: 'code'
          }
        }
      }
    };
  }
  
  Amplify.configure(amplifyConfig);
};

// Initial configuration
configureAmplify(window.currentEnvironment);

// Global function to switch environments
window.switchEnvironment = (envKey) => {
  window.currentEnvironment = envKey;
  localStorage.setItem('selectedEnvironment', envKey);
  configureAmplify(envKey);
  console.log(`✅ Switched to ${envKey} environment`);
  // No page reload needed - auth session persists
};

console.log('✅ Amplify configured');

// Create and mount Vue app
createApp(App).mount('#app');
console.log('✅ App mounted');