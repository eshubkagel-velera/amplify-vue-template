import { generateClient } from 'aws-amplify/api';

let client = null;

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