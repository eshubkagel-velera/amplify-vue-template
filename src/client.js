import { fetchAllPages } from './utils/pagination.js';
import * as queries from './graphql/queries';

export const getClient = () => {
  // Return a wrapper that uses the unified GraphQL client
  return {
    graphql: async ({ query, variables = {} }) => {
      const { executeGraphQL } = await import('./utils/unifiedGraphQLClient.js');
      return await executeGraphQL(query, variables);
    }
  };
};

// Helper function using unified GraphQL client
export const callExternalApi = async (environment, query, variables = {}) => {
  try {
    const { executeGraphQL } = await import('./utils/unifiedGraphQLClient.js');
    
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
      // Use unified client with pagination
      const client = { graphql: async (params) => executeGraphQL(params.query, params.variables, environment) };
      let items = await fetchAllPages(client, queryConfig.query, variables, queryConfig.dataKey);
      
      // Filter SERVICE_PARAM by service if a service filter is set
      if (queryConfig.dataKey === 'listSERVICE_PARAMS') {
        if (window.selectedServiceFilter) {
          items = items.filter(param => param.SERVICE_ID === parseInt(window.selectedServiceFilter));
        }
      }
      
      const transformedData = {
        data: {
          [queryConfig.dataKey]: {
            items
          }
        }
      };
      
      return transformedData;
    } else {
      // Handle mutation operations or other non-list queries
      const result = await executeGraphQL(query, variables, environment);
      return result;
    }
  } catch (error) {
    throw error;
  }
};