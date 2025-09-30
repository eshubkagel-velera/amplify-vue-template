import { fetchAuthSession } from 'aws-amplify/auth';

// Unified GraphQL client that works for any environment
export const executeGraphQL = async (operation, variables = {}, targetEnvironment = null) => {
  try {
    // Get environment - use targetEnvironment if provided, otherwise current environment
    const environment = targetEnvironment || localStorage.getItem('selectedEnvironment') || 'dev';
    
    const envUrls = {
      dev: import.meta.env.VITE_DEV_GRAPHQL_URL,
      test: import.meta.env.VITE_TEST_GRAPHQL_URL,
      uat: import.meta.env.VITE_UAT_GRAPHQL_URL,
      live: import.meta.env.VITE_LIVE_GRAPHQL_URL
    };
    
    const endpoint = envUrls[environment];
    if (!endpoint) {
      throw new Error(`Invalid environment: ${environment}`);
    }
    
    // Get authentication token
    const session = await fetchAuthSession();
    const token = session.tokens?.accessToken?.toString();
    
    if (!token) {
      throw new Error('No authentication token available');
    }
    
    // Execute GraphQL operation
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token
      },
      body: JSON.stringify({ 
        query: operation, 
        variables 
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    // GraphQL errors are handled by caller
    
    return result;
  } catch (error) {
    throw error;
  }
};