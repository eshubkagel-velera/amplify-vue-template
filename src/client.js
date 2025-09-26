import { generateClient } from 'aws-amplify/api';
import { fetchAllPages } from './utils/pagination.js';
import * as queries from './graphql/queries';

let client = null;

export const clearClientCache = () => {
  console.log('🗑️ Clearing client cache');
  client = null;
};

export const getClient = () => {
  if (!client) {
    console.log('🔄 Creating Amplify client...');
    try {
      client = generateClient({
        authMode: 'userPool'
      });
      console.log('✅ Amplify client created successfully');
    } catch (error) {
      console.error('❌ Failed to create Amplify client:', error);
      throw error;
    }
  }
  return client;
};

// Make clearClientCache available globally
window.clearClientCache = clearClientCache;

// Helper function to make direct GraphQL API calls with pagination support
export const callExternalApi = async (environment, query, variables = {}) => {
  const client = getClient();
  try {
    // Map query names to their corresponding GraphQL queries and data keys
    const queryMap = {
      'listSERVICE_PROVIDERS': { query: queries.listServiceProviders, dataKey: 'listSERVICE_PROVIDERS' },
      'ListServiceProviders': { query: queries.listServiceProviders, dataKey: 'listSERVICE_PROVIDERS' },
      'listSERVICES': { query: queries.listServices, dataKey: 'listSERVICES' },
      'ListServices': { query: queries.listServices, dataKey: 'listSERVICES' },
      'listSERVICE_PARAMS': { query: queries.listServiceParams, dataKey: 'listSERVICE_PARAMS' },
      'ListServiceParams': { query: queries.listServiceParams, dataKey: 'listSERVICE_PARAMS' },
      'listSERVICE_PARAM_MAPPINGS': { query: queries.listServiceParamMappings, dataKey: 'listSERVICE_PARAM_MAPPINGS' },
      'listREDIRECT_URLS': { query: queries.listRedirectUrls, dataKey: 'listREDIRECT_URLS' },
      'listSTEP_SERVICE_MAPPINGS': { query: queries.listStepServiceMappings, dataKey: 'listSTEP_SERVICE_MAPPINGS' },
      'listSTEP_TYPES': { query: queries.listStepTypes, dataKey: 'listSTEP_TYPES' },
      'listORIGIN_PRODUCTS': { query: queries.listOriginProducts, dataKey: 'listORIGIN_PRODUCTS' }
    };
    
    // Find matching query configuration
    let queryConfig = null;
    for (const [key, config] of Object.entries(queryMap)) {
      if (query.includes(key)) {
        queryConfig = config;
        break;
      }
    }
    
    if (queryConfig) {
      console.log('🔍 Executing paginated GraphQL query for:', queryConfig.dataKey);
      
      // Use pagination helper to fetch all pages
      const items = await fetchAllPages(client, queryConfig.query, variables, queryConfig.dataKey);
      
      const transformedData = {
        data: {
          [queryConfig.dataKey]: {
            items
          }
        }
      };
      
      console.log('✅ Paginated query completed, total items:', items.length);
      return transformedData;
    } else {
      // Handle mutation operations or other non-list queries
      console.log('🔍 Executing non-paginated GraphQL operation:', query);
      
      const result = await client.graphql({
        query,
        variables
      });
      
      if (result.errors && result.errors.length > 0) {
        console.error('❌ GraphQL has errors!');
        console.error('❌ Errors:', JSON.stringify(result.errors, null, 2));
        result.errors.forEach(error => {
          console.error('❌ Error details:', error.message, error.locations, error.path);
        });
      }
      
      return result;
    }
  } catch (error) {
    console.error('External API call failed:', error);
    console.error('Full error object:', JSON.stringify(error, null, 2));
    throw error;
  }
};