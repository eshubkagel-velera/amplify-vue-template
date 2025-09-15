import { Amplify } from 'aws-amplify';
import { createApp } from 'vue';
import App from './App.vue';

console.log('🚀 Starting GraphQL API Manager');

// Configure Amplify
Amplify.configure({
  API: {
    GraphQL: {
      endpoint: import.meta.env.VITE_APPSYNC_API_URL,
      region: import.meta.env.VITE_APPSYNC_REGION,
      defaultAuthMode: 'apiKey',
      apiKey: import.meta.env.VITE_APPSYNC_API_KEY
    }
  },
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_USER_POOL_ID,
      userPoolClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID,
      region: import.meta.env.VITE_APPSYNC_REGION,
      loginWith: {
        oauth: {
          domain: 'velera-hazel-config.auth.us-east-2.amazoncognito.com',
          scopes: ['email', 'openid', 'profile'],
          redirectSignIn: ['https://main.d120tqgz0vig6b.amplifyapp.com/'],
          redirectSignOut: ['https://main.d120tqgz0vig6b.amplifyapp.com/'],
          responseType: 'code'
        }
      }
    }
  }
});

console.log('✅ Amplify configured');

// Create and mount Vue app
createApp(App).mount('#app');
console.log('✅ App mounted');