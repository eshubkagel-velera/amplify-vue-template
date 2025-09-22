import { generateClient } from 'aws-amplify/api';

let client = null;
let userPoolClient = null;
let currentEnv = null;

export const getClient = () => {
  // Always recreate client to ensure it uses current environment config
  console.log(`🔄 Creating Amplify client for ${window.currentEnvironment}...`);
  try {
    client = generateClient({
      authMode: 'apiKey'
    });
    console.log('✅ Amplify client created successfully');
    currentEnv = window.currentEnvironment;
  } catch (error) {
    console.error('❌ Failed to create Amplify client:', error);
    throw error;
  }
  return client;
};

export const getUserPoolClient = () => {
  // Always recreate client to ensure it uses current environment config
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
  return userPoolClient;
};