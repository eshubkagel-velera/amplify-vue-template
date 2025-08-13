import { Amplify } from 'aws-amplify';

console.log('🔧 Configuring Amplify...');
console.log('📍 Endpoint:', import.meta.env.VITE_APPSYNC_API_URL);
console.log('🌍 Region:', import.meta.env.VITE_APPSYNC_REGION);
console.log('🔑 API Key:', import.meta.env.VITE_APPSYNC_API_KEY ? 'Present' : 'Missing');

// Configure Amplify FIRST before any other imports
Amplify.configure({
  API: {
    GraphQL: {
      endpoint: import.meta.env.VITE_APPSYNC_API_URL,
      region: import.meta.env.VITE_APPSYNC_REGION,
      defaultAuthMode: 'apiKey',
      apiKey: import.meta.env.VITE_APPSYNC_API_KEY
    }
  }
});

console.log('✅ Amplify configured successfully');

import "./assets/main.css";
import { createApp } from "vue";
import App from "./App.vue";

createApp(App).mount("#app");