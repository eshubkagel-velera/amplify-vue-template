import type { Handler } from 'aws-lambda';

// Declare global process for Node.js environment
declare const process: {
  env: {
    [key: string]: string | undefined;
  };
};

interface ExternalApiEvent {
  arguments: {
    environment: string;
    query: string;
    variables?: string;
  };
}

interface EndpointConfig {
  [key: string]: string | undefined;
}

// Allowed query operations for security
const ALLOWED_OPERATIONS = [
  'listLoanApps',
  'getLoanApp',
  'createLoanApp',
  'updateLoanApp',
  'deleteLoanApp',
  'listOriginProducts',
  'getOriginProduct',
  'listServiceProviders',
  'getServiceProvider',
  'listServices',
  'getService'
];

function validateQuery(query: string): void {
  const hasAllowedOperation = ALLOWED_OPERATIONS.some(op => query.includes(op));
  if (!hasAllowedOperation) {
    throw new Error('Query contains unauthorized operations');
  }
  
  // Basic query structure validation
  if (!query.trim().startsWith('query') && !query.trim().startsWith('mutation')) {
    throw new Error('Invalid GraphQL query format');
  }
}

export const handler: Handler = async (event: ExternalApiEvent) => {
  const { environment, query, variables } = event.arguments;
  
  // Validate inputs
  if (!environment || !query) {
    throw new Error('Environment and query are required');
  }
  
  validateQuery(query);
  
  const endpoints: EndpointConfig = {
    dev: process.env.DEV_APPSYNC_ENDPOINT,
    test: process.env.TEST_APPSYNC_ENDPOINT,
  };
  
  const apiKeys: EndpointConfig = {
    dev: process.env.DEV_APPSYNC_API_KEY,
    test: process.env.TEST_APPSYNC_API_KEY,
  };
  
  const endpoint = endpoints[environment];
  const apiKey = apiKeys[environment];
  
  if (!endpoint || !apiKey) {
    throw new Error(`Invalid environment: ${environment}`);
  }
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        query,
        variables: variables ? JSON.parse(variables) : undefined,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('External API call failed:', error);
    throw error;
  }
};