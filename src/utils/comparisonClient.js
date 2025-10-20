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
  
  const queryMap = {
    'CONFIG_PARAM': { query: queries.listConfigParams, listKey: 'listCONFIG_PARAMS' },
    'ORIGIN_PRODUCT': { query: queries.listOriginProducts, listKey: 'listORIGIN_PRODUCTS' },
    'SERVICE_PROVIDER': { query: queries.listServiceProviders, listKey: 'listSERVICE_PROVIDERS' },
    'SERVICE': { query: queries.listServices, listKey: 'listSERVICES' },
    'SERVICE_PARAM': { query: queries.listServiceParams, listKey: 'listSERVICE_PARAMS' },
    'STEP_TYPE': { query: queries.listStepTypes, listKey: 'listSTEP_TYPES' },
    'REDIRECT_URL': { query: queries.listRedirectUrls, listKey: 'listREDIRECT_URLS' },
    'SERVICE_PARAM_MAPPING': { query: queries.listServiceParamMappings, listKey: 'listSERVICE_PARAM_MAPPINGS' },
    'STEP_SERVICE_MAPPING': { query: queries.listStepServiceMappings, listKey: 'listSTEP_SERVICE_MAPPINGS' },
    'FILTER_CRITERIA': { query: queries.listFilterCriterias, listKey: 'listFILTER_CRITERIAS' },
    'SORT_CRITERIA': { query: queries.listSortCriterias, listKey: 'listSORT_CRITERIAS' },
    'SERVICE_DOMAIN': { query: queries.listServiceDomains, listKey: 'listSERVICE_DOMAINS' },
    'SERVICE_EXPR_MAPPING': { query: queries.listServiceExprMappings, listKey: 'listSERVICE_EXPR_MAPPINGS' },
    'STEP_TYPE_PARAM_MAP': { query: queries.listStepTypeParamMaps, listKey: 'listSTEP_TYPE_PARAM_MAPS' }
  };
  
  const config = queryMap[entityName];
  if (!config) return { data: {} };
  
  let items = await fetchAllPages(client, config.query, {}, config.listKey);
  
  // Apply foreign key enhancements if configured
  const { getEntityConfig } = await import('../config/entityConfigLoader.js');
  const entityConfig = getEntityConfig(entityName);
  
  if (entityConfig?.foreignKeys) {
    items = await enhanceWithForeignKeys(items, entityConfig, client);
  }
  
  return { data: { [config.listKey]: { items } } };
};

const enhanceWithForeignKeys = async (items, config, client) => {
  if (!config.foreignKeys) return items;
  
  try {
    const foreignKeyLookups = new Map();
    
    // Load foreign key data for each configured relationship
    for (const [fieldName, fkConfig] of Object.entries(config.foreignKeys)) {
      const queryName = `list${fkConfig.table.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join('')}s`;
      const listName = `list${fkConfig.table}S`;
      
      const queries = await import('../graphql/queries.js');
      if (queries[queryName]) {
        const result = await client.graphql({ query: queries[queryName] });
        const foreignItems = result.data[listName]?.items || [];
        
        // Create lookup map
        const lookupMap = new Map();
        foreignItems.forEach(item => {
          lookupMap.set(item[fkConfig.valueField], item[fkConfig.displayField]);
        });
        
        foreignKeyLookups.set(fieldName, lookupMap);
      }
    }
    
    // Enhance items with foreign key display values
    return items.map(item => {
      const enhancedItem = { ...item };
      
      Object.keys(config.foreignKeys).forEach(fieldName => {
        const fkConfig = config.foreignKeys[fieldName];
        const lookupMap = foreignKeyLookups.get(fieldName);
        
        if (lookupMap && enhancedItem[fieldName]) {
          const displayValue = lookupMap.get(enhancedItem[fieldName]);
          if (displayValue) {
            enhancedItem[`${fieldName}_DISPLAY`] = `${enhancedItem[fieldName]}: ${displayValue}`;
          }
        }
      });
      
      return enhancedItem;
    });
  } catch (error) {
    console.error('Failed to enhance with foreign keys:', error);
    return items;
  }
  
  return { data: {} };
};

import { executeGraphQL } from './unifiedGraphQLClient.js';

export const createComparisonRecord = async (environment, entityName, formData) => {
  console.log(`Creating ${entityName} record in ${environment}`);
  
  try {
    // For SERVICE_PARAM, map SERVICE_ID to the target environment's equivalent
    if (entityName === 'SERVICE_PARAM' && formData.SERVICE_ID) {
      const sourceEnvironment = localStorage.getItem('selectedEnvironment') || 'dev';
      const [targetServices, sourceServices] = await Promise.all([
        fetchAllPages(createComparisonClient(environment), (await import('../graphql/queries.js')).listServices, {}, 'listSERVICES'),
        fetchAllPages(createComparisonClient(sourceEnvironment), (await import('../graphql/queries.js')).listServices, {}, 'listSERVICES')
      ]);
      
      // Find the source service
      const sourceService = sourceServices.find(s => s.SERVICE_ID === formData.SERVICE_ID);
      if (!sourceService) {
        throw new Error(`Source SERVICE_ID ${formData.SERVICE_ID} not found`);
      }
      
      // Find matching service in target environment by URI
      const targetService = targetServices.find(s => s.URI === sourceService.URI);
      if (!targetService) {
        throw new Error(`No matching service found in ${environment} for URI: ${sourceService.URI}`);
      }
      
      console.log(`Mapping SERVICE_ID ${formData.SERVICE_ID} -> ${targetService.SERVICE_ID} for ${environment}`);
      formData.SERVICE_ID = targetService.SERVICE_ID;
    }
    
    const mutations = await import('../graphql/mutations.js');
    
    // Get entity configuration to determine which fields are valid
    const { getEntityConfig } = await import('../config/entityConfigLoader.js');
    const entityConfig = getEntityConfig(entityName);
    
    // Remove fields that shouldn't be included in create mutations
    const cleanFormData = { ...formData };
    delete cleanFormData.CHANGED_DATE;
    delete cleanFormData.CHANGED_BY_USER_ID;
    delete cleanFormData[`${entityName}_ID`]; // Remove primary key
    
    // Remove display fields based on config
    if (entityConfig?.fieldsToRemove) {
      entityConfig.fieldsToRemove.forEach(field => {
        delete cleanFormData[field];
      });
    }
    
    // Only set audit fields if they exist in the entity's formFields
    const processedFormData = { ...cleanFormData };
    if (entityConfig?.formFields?.some(field => field.name === 'CREATED_DATE')) {
      processedFormData.CREATED_DATE = new Date().toISOString().split('T')[0];
    }
    if (entityConfig?.formFields?.some(field => field.name === 'CREATED_BY_USER_ID')) {
      processedFormData.CREATED_BY_USER_ID = parseInt(cleanFormData.CREATED_BY_USER_ID || 1);
    }
    
    // Remove any audit fields that don't exist in this entity's schema
    if (!entityConfig?.formFields?.some(field => field.name === 'CREATED_BY_USER_ID')) {
      delete processedFormData.CREATED_BY_USER_ID;
    }
    if (!entityConfig?.formFields?.some(field => field.name === 'CHANGED_BY_USER_ID')) {
      delete processedFormData.CHANGED_BY_USER_ID;
    }
    
    const mutationMap = {
      'CONFIG_PARAM': mutations.createConfigParam,
      'ORIGIN_PRODUCT': mutations.createOriginProduct,
      'REDIRECT_URL': mutations.createRedirectUrl,
      'SERVICE': mutations.createService,
      'SERVICE_PROVIDER': mutations.createServiceProvider,
      'SERVICE_PARAM': mutations.createServiceParam,
      'SERVICE_DOMAIN': mutations.createServiceDomain,
      'STEP_TYPE': mutations.createStepType,
      'FILTER_CRITERIA': mutations.createFilterCriteria,
      'SORT_CRITERIA': mutations.createSortCriteria,
      'SERVICE_PARAM_MAPPING': mutations.createServiceParamMapping,
      'SERVICE_EXPR_MAPPING': mutations.createServiceExprMapping,
      'STEP_SERVICE_MAPPING': mutations.createStepServiceMapping,
      'STEP_TYPE_PARAM_MAP': mutations.createStepTypeParamMap
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
  console.log(`[${Date.now()}] Updating ${entityName} record in ${environment}`);
  
  try {
    const mutations = await import('../graphql/mutations.js');
    
    // Remove CREATED fields from update data
    const cleanUpdateData = { ...updateData };
    delete cleanUpdateData.CREATED_BY_USER_ID;
    delete cleanUpdateData.CREATED_DATE;
    
    console.log('Clean update data:', cleanUpdateData);
    
    const mutationMap = {
      'CONFIG_PARAM': mutations.updateConfigParam,
      'ORIGIN_PRODUCT': mutations.updateOriginProduct,
      'REDIRECT_URL': mutations.updateRedirectUrl,
      'SERVICE': mutations.updateService,
      'SERVICE_PROVIDER': mutations.updateServiceProvider,
      'SERVICE_PARAM': mutations.updateServiceParam,
      'SERVICE_DOMAIN': mutations.updateServiceDomain,
      'STEP_TYPE': mutations.updateStepType,
      'FILTER_CRITERIA': mutations.updateFilterCriteria,
      'SORT_CRITERIA': mutations.updateSortCriteria,
      'SERVICE_PARAM_MAPPING': mutations.updateServiceParamMapping,
      'SERVICE_EXPR_MAPPING': mutations.updateServiceExprMapping,
      'STEP_SERVICE_MAPPING': mutations.updateStepServiceMapping,
      'STEP_TYPE_PARAM_MAP': mutations.updateStepTypeParamMap
    };
    
    console.log('Available mutations:', Object.keys(mutationMap));
    console.log('Looking for entity:', entityName);
    
    const mutation = mutationMap[entityName];
    console.log('Found mutation:', !!mutation);
    
    if (!mutation) {
      throw new Error(`Update mutation not implemented for ${entityName}`);
    }
    
    const result = await executeGraphQL(mutation, { input: cleanUpdateData }, environment);
    return result;
  } catch (error) {
    console.error(`Error updating ${entityName} in ${environment}:`, error);
    throw error;
  }
};