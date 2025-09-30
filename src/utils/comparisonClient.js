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
  
  // Store the environment for other functions to use
  window.compareEnvironment = environment;
  
  const envUrls = {
    dev: import.meta.env.VITE_DEV_GRAPHQL_URL,
    test: import.meta.env.VITE_TEST_GRAPHQL_URL,
    uat: import.meta.env.VITE_UAT_GRAPHQL_URL,
    live: import.meta.env.VITE_LIVE_GRAPHQL_URL
  };
  
  const client = createComparisonClient(environment);
  
  console.log('Loading', entityName, 'from', environment);
  console.log('Using GraphQL endpoint:', envUrls[environment]);
  
  if (entityName === 'ORIGIN_PRODUCT') {
    const items = await fetchAllPages(client, queries.listOriginProducts, {}, 'listORIGIN_PRODUCTS');
    return { data: { listORIGIN_PRODUCTS: { items } } };
  } else if (entityName === 'SERVICE_PROVIDER') {
    console.log('Fetching SERVICE_PROVIDER data from', environment);
    const items = await fetchAllPages(client, queries.listServiceProviders, {}, 'listSERVICE_PROVIDERS');
    console.log('Raw SERVICE_PROVIDER items loaded:', items.length);
    console.log('SERVICE_PROVIDER items:', items);
    return { data: { listSERVICE_PROVIDERS: { items } } };
  } else if (entityName === 'SERVICE') {
    console.log('Fetching services and providers from', environment);
    const [services, providers] = await Promise.all([
      fetchAllPages(client, queries.listServices, {}, 'listSERVICES'),
      fetchAllPages(client, queries.listServiceProviders, {}, 'listSERVICE_PROVIDERS')
    ]);
    
    console.log('Raw services loaded:', services.length);
    console.log('Raw providers loaded:', providers.length);
    
    const enhancedServices = services.map(service => {
      const provider = providers.find(p => p.SERVICE_PROVIDER_ID === service.SERVICE_PROVIDER_ID);
      return {
        ...service,
        'Service Provider': provider ? `${provider.SERVICE_PROVIDER_ID}: ${provider.SERVICE_PROVIDER_NAME}` : service.SERVICE_PROVIDER_ID
      };
    });
    
    console.log('Enhanced services:', enhancedServices.length);
    return { data: { listSERVICES: { items: enhancedServices } } };
  } else if (entityName === 'SERVICE_PARAM') {
    const items = await fetchAllPages(client, queries.listServiceParams, {}, 'listSERVICE_PARAMS');
    return { data: { listSERVICE_PARAMS: { items } } };
  } else if (entityName === 'STEP_TYPE') {
    const items = await fetchAllPages(client, queries.listStepTypes, {}, 'listSTEP_TYPES');
    return { data: { listSTEP_TYPES: { items } } };
  } else if (entityName === 'REDIRECT_URL') {
    const [redirectUrls, products] = await Promise.all([
      fetchAllPages(client, queries.listRedirectUrls, {}, 'listREDIRECT_URLS'),
      fetchAllPages(client, queries.listOriginProducts, {}, 'listORIGIN_PRODUCTS')
    ]);
    
    const enhancedUrls = redirectUrls.map(url => {
      const product = products.find(p => p.ORIGIN_PRODUCT_ID === url.ORIGIN_PRODUCT_ID);
      return {
        ...url,
        PRODUCT_ID: product ? product.PRODUCT_ID : ''
      };
    });
    
    return { data: { listREDIRECT_URLS: { items: enhancedUrls } } };
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

import { executeGraphQL } from './unifiedGraphQLClient.js';

export const createComparisonRecord = async (environment, entityName, formData) => {
  console.log(`Creating ${entityName} record in ${environment}`);
  
  try {
    const mutations = await import('../graphql/mutations.js');
    
    const processedFormData = {
      ...formData,
      CREATED_BY_USER_ID: parseInt(formData.CREATED_BY_USER_ID)
    };
    
    const mutationMap = {
      'ORIGIN_PRODUCT': mutations.createOriginProduct,
      'REDIRECT_URL': mutations.createRedirectUrl(environment),
      'SERVICE': mutations.createService,
      'SERVICE_PROVIDER': mutations.createServiceProvider
    };
    
    const mutation = mutationMap[entityName];
    if (!mutation) {
      throw new Error(`Create mutation not implemented for ${entityName}`);
    }
    
    const result = await executeGraphQL(mutation, { input: processedFormData }, environment);
    
    if (result.errors && result.errors.length > 0) {
      throw new Error(`GraphQL errors: ${result.errors.map(e => e.message).join(', ')}`);
    }
    
    const mutationKey = `create${entityName}`;
    if (result.data && result.data[mutationKey] === null) {
      console.log('Create mutation returned null - this is expected with Aurora VTL templates');
      return {
        data: {
          [mutationKey]: {
            ...processedFormData,
            [`${entityName}_ID`]: -1
          }
        }
      };
    }
    
    return result;
  } catch (error) {
    console.error(`Error creating ${entityName} in ${environment}:`, error);
    throw error;
  }
};

export const updateComparisonRecord = async (environment, entityName, updateData) => {
  console.log(`Updating ${entityName} record in ${environment}`);
  
  try {
    const mutations = await import('../graphql/mutations.js');
    
    const mutationMap = {
      'ORIGIN_PRODUCT': mutations.updateOriginProduct,
      'REDIRECT_URL': mutations.updateRedirectUrl(environment),
      'SERVICE': mutations.updateService,
      'SERVICE_PROVIDER': mutations.updateServiceProvider
    };
    
    const mutation = mutationMap[entityName];
    if (!mutation) {
      throw new Error(`Update mutation not implemented for ${entityName}`);
    }
    
    const result = await executeGraphQL(mutation, { input: updateData }, environment);
    return result;
  } catch (error) {
    console.error(`Error updating ${entityName} in ${environment}:`, error);
    throw error;
  }
};