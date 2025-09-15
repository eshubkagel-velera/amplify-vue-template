import { generateClient } from 'aws-amplify/api';

let client = null;
let userPoolClient = null;

export const getClient = () => {
  if (!client) {
    console.log('🔄 Creating Amplify client...');
    try {
      client = generateClient();
      console.log('✅ Amplify client created successfully');
    } catch (error) {
      console.error('❌ Failed to create Amplify client:', error);
      throw error;
    }
  }
  return client;
};

export const getUserPoolClient = () => {
  if (!userPoolClient) {
    console.log('🔐 Creating UserPool client...');
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