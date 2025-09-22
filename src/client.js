import { generateClient } from 'aws-amplify/api';

let client = null;

export const getClient = () => {
  if (!client) {
    console.log('🔄 Creating Amplify client...');
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

// Helper function to make external API calls through backend
export const callExternalApi = async (environment, query, variables = {}) => {
  const client = getClient();
  try {
    // Check if externalQuery is available (backend deployed)
    if (!client.queries || !client.queries.externalQuery) {
      throw new Error('Backend not deployed - externalQuery not available. Please deploy the Amplify backend first.');
    }
    
    const result = await client.queries.externalQuery({
      environment,
      query,
      variables: JSON.stringify(variables)
    });
    return JSON.parse(result.data);
  } catch (error) {
    console.error('External API call failed:', error);
    throw error;
  }
};