import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/api';
import { fetchAllPages } from './pagination.js';
import * as queries from '../graphql/queries';

// Create a dedicated client for comparison environment
export const createComparisonClient = (environment) => {
  const envUrls = {
    dev: import.meta.env.VITE_DEV_GRAPHQL_URL,
    test: import.meta.env.VITE_TEST_GRAPHQL_URL,
    uat: import.meta.env.VITE_UAT_GRAPHQL_URL,
    live: import.meta.env.VITE_LIVE_GRAPHQL_URL
  };

  // Create isolated Amplify configuration
  const config = {
    Auth: {
      Cognito: {
        userPoolId: import.meta.env.VITE_USER_POOL_ID,
        userPoolClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID,
        region: import.meta.env.VITE_APPSYNC_REGION
      }
    },
    API: {
      GraphQL: {
        endpoint: envUrls[environment],
        region: import.meta.env.VITE_APPSYNC_REGION,
        defaultAuthMode: 'userPool'
      }
    }
  };

  // Return a mock client that uses direct fetch to avoid global config interference
  return {
    graphql: async ({ query, variables = {} }) => {
      const { fetchAuthSession } = await import('aws-amplify/auth');
      const session = await fetchAuthSession();
      const token = session.tokens?.accessToken?.toString();
      
      const response = await fetch(envUrls[environment], {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({ query, variables })
      });
      
      return await response.json();
    }
  };
};

// Load functions using comparison client
export const loadComparisonData = async (entityName) => {
  const environment = window.compareEnvironment || localStorage.getItem('compareEnvironment');
  if (!environment) {
    return { data: {} };
  }
  
  const client = createComparisonClient(environment);
  
  console.log('Loading', entityName, 'from', environment);
  
  if (entityName === 'ORIGIN_PRODUCT') {
    const items = await fetchAllPages(client, queries.listOriginProducts, {}, 'listORIGIN_PRODUCTS');
    return { data: { listORIGIN_PRODUCTS: { items } } };
  } else if (entityName === 'SERVICE_PROVIDER') {
    const items = await fetchAllPages(client, queries.listServiceProviders, {}, 'listSERVICE_PROVIDERS');
    return { data: { listSERVICE_PROVIDERS: { items } } };
  } else if (entityName === 'SERVICE') {
    const [services, providers] = await Promise.all([
      fetchAllPages(client, queries.listServices, {}, 'listSERVICES'),
      fetchAllPages(client, queries.listServiceProviders, {}, 'listSERVICE_PROVIDERS')
    ]);
    
    const enhancedServices = services.map(service => {
      const provider = providers.find(p => p.SERVICE_PROVIDER_ID === service.SERVICE_PROVIDER_ID);
      return {
        ...service,
        'Service Provider': provider ? `${provider.SERVICE_PROVIDER_ID}: ${provider.SERVICE_PROVIDER_NAME}` : service.SERVICE_PROVIDER_ID
      };
    });
    
    return { data: { listSERVICES: { items: enhancedServices } } };
  } else if (entityName === 'SERVICE_PARAM') {
    const items = await fetchAllPages(client, queries.listServiceParams, {}, 'listSERVICE_PARAMS');
    return { data: { listSERVICE_PARAMS: { items } } };
  } else if (entityName === 'STEP_TYPE') {
    const items = await fetchAllPages(client, queries.listStepTypes, {}, 'listSTEP_TYPES');
    return { data: { listSTEP_TYPES: { items } } };
  } else if (entityName === 'REDIRECT_URL') {
    const items = await fetchAllPages(client, queries.listRedirectUrls, {}, 'listREDIRECT_URLS');
    return { data: { listREDIRECT_URLS: { items } } };
  } else if (entityName === 'SERVICE_PARAM_MAPPING') {
    const items = await fetchAllPages(client, queries.listServiceParamMappings, {}, 'listSERVICE_PARAM_MAPPINGS');
    return { data: { listSERVICE_PARAM_MAPPINGS: { items } } };
  } else if (entityName === 'STEP_SERVICE_MAPPING') {
    const [mappings, stepTypes, services] = await Promise.all([
      fetchAllPages(client, queries.listStepServiceMappings, {}, 'listSTEP_SERVICE_MAPPINGS'),
      fetchAllPages(client, queries.listStepTypes, {}, 'listSTEP_TYPES'),
      fetchAllPages(client, queries.listServices, {}, 'listSERVICES')
    ]);
    
    const enhancedMappings = mappings.map(mapping => {
      const stepType = stepTypes.find(st => st.STEP_TYPE_ID === mapping.STEP_TYPE_ID);
      const service = services.find(s => s.SERVICE_ID === mapping.SERVICE_ID);
      return {
        ...mapping,
        'STEP_TYPE': stepType ? `${stepType.STEP_TYPE_ID}: ${stepType.STEP_TYPE_NAME}` : mapping.STEP_TYPE_ID,
        'SERVICE': service ? `${service.SERVICE_ID}: ${service.URI}` : mapping.SERVICE_ID
      };
    });
    
    return { data: { listSTEP_SERVICE_MAPPINGS: { items: enhancedMappings } } };
  }
  
  return { data: {} };
};