import { Amplify } from 'aws-amplify';
import { createApp } from 'vue';
import App from './App.vue';

console.log('🚀 Starting GraphQL API Manager');

// Import environment configuration
import { environments } from './config/environments';

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