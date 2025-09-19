import { generateClient } from 'aws-amplify/api';

let client = null;
let userPoolClient = null;
let currentEnv = null;

export const getClient = () => {
  // Recreate client if environment changed
  if (!client || currentEnv !== window.currentEnvironment) {
    console.log(`🔄 Creating Amplify client for ${window.currentEnvironment}...`);
    currentEnv = window.currentEnvironment;
    try {
      client = generateClient({
        authMode: 'apiKey'
      });
      console.log('✅ Amplify client created successfully');
    } catch (error) {
      console.error('❌ Failed to create Amplify client:', error);
      throw error;
    }
  }
  return client;
};

export const getUserPoolClient = () => {
  // Recreate client if environment changed
  if (!userPoolClient || currentEnv !== window.currentEnvironment) {
    console.log(`🔐 Creating UserPool client for ${window.currentEnvironment}...`);
    try {
      userPoolClient = generateClient({
        authMode: 'userPool'
      });
      console.log('✅ UserPool client created successfully');
    } catch (error) {
      console.error('❌ Failed to create UserPool client:', error);
      throw error;
    }
  }
  return userPoolClient;
};