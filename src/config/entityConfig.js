import * as queries from '../graphql/queries';
import * as mutations from '../graphql/mutations';
import { fetchAllPages } from '../utils/pagination.js';

// CRUD function generators
const createCrudFunctions = (entityName, client, fieldLookups = {}) => {
  const listName = `list${entityName}S`;
  const queryName = `list${entityName.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join('')}s`;
  const mutationBase = entityName.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join('');
  
  return {
    loadFunction: async () => {
      const items = await fetchAllPages(client, queries[queryName], {}, listName);
      
      // If no field lookups, return items as-is
      if (!fieldLookups || Object.keys(fieldLookups).length === 0) {
        return { data: { [listName]: { items } } };
      }
      
      // Load lookup data for all configured lookups
      const lookupPromises = Object.values(fieldLookups).map(lookup => {
        const lookupQueryName = `list${lookup.lookupTable.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join('')}s`;
        const lookupListName = `list${lookup.lookupTable}S`;
        return fetchAllPages(client, queries[lookupQueryName], {}, lookupListName);
      });
      
      const lookupResults = await Promise.all(lookupPromises);
      const lookupData = {};
      
      // Map lookup results to their table names
      Object.values(fieldLookups).forEach((lookup, index) => {
        lookupData[lookup.lookupTable] = lookupResults[index];
      });
      
      // Enhance items with lookup data
      const enhancedItems = items.map(item => {
        const enhanced = { ...item };
        
        Object.entries(fieldLookups).forEach(([displayField, lookup]) => {
          const lookupItems = lookupData[lookup.lookupTable];
          const matchedItem = lookupItems.find(lookupItem => 
            lookupItem[lookup.foreignKey] === item[lookup.foreignKey]
          );
          
          if (matchedItem) {
            // Apply display format
            let displayValue = lookup.displayFormat;
            displayValue = displayValue.replace(`{${lookup.foreignKey}}`, matchedItem[lookup.foreignKey]);
            displayValue = displayValue.replace(`{${lookup.displayField}}`, matchedItem[lookup.displayField]);
            enhanced[displayField] = displayValue;
          } else {
            enhanced[displayField] = '';
          }
        });
        
        return enhanced;
      });
      
      return { data: { [listName]: { items: enhancedItems } } };
    },
    createFunction: async (input) => {
      return await client.graphql({ query: mutations[`create${mutationBase}`], variables: { input } });
    },
    updateFunction: async (input) => {
      return await client.graphql({ query: mutations[`update${mutationBase}`], variables: { input } });
    },
    deleteFunction: async (input) => {
      return await client.graphql({ query: mutations[`delete${mutationBase}`], variables: { input } });
    }
  };
};

// Entity configurations
export const getEntityConfigs = (client) => [
  {
    name: 'ORIGIN_PRODUCT',
    fields: ['ORIGIN_PRODUCT_ID', 'VENDOR_NAME', 'PRODUCT_ID', 'PRODUCT_DESC', 'PSCU_CLIENT_ID', 'PARTNER_CODE', 'CREATED_BY_USER_ID', 'CREATED_DATE', 'CHANGED_BY_USER_ID', 'CHANGED_DATE'],
    formFields: [
      { name: 'VENDOR_NAME', type: 'text', required: true, disabled: false },
      { name: 'PSCU_CLIENT_ID', type: 'number', required: true, disabled: false },
      { name: 'PRODUCT_ID', type: 'text', required: true, disabled: false },
      { name: 'PRODUCT_DESC', type: 'text', required: true, disabled: false },
      { name: 'PARTNER_CODE', type: 'text', required: false, disabled: false },
      { name: 'CREATED_DATE', type: 'date', required: true, disabled: true },
      { name: 'CREATED_BY_USER_ID', type: 'number', required: true, disabled: false }
    ],
    idField: 'ORIGIN_PRODUCT_ID',
    hasRowActions: true,
    rowActions: ['mapping', 'redirectUrls'],
    ...createCrudFunctions('ORIGIN_PRODUCT', client)
  },
  {
    name: 'SERVICE',
    fields: ['SERVICE_ID', 'Service Provider', 'URI', 'SECRET_NAME', 'REQUEST_TYPE', 'CREATED_BY_USER_ID', 'CREATED_DATE', 'CHANGED_BY_USER_ID', 'CHANGED_DATE'],
    formFields: [
      { name: 'SERVICE_PROVIDER_ID', type: 'select', required: true, disabled: false, options: [] },
      { name: 'URI', type: 'text', required: true, disabled: false },
      { name: 'SECRET_NAME', type: 'text', required: false, disabled: false },
      { name: 'REQUEST_TYPE', type: 'select', required: false, disabled: false, options: [
        { value: 'get', label: 'GET' },
        { value: 'post', label: 'POST' },
        { value: 'put', label: 'PUT' },
        { value: 'delete', label: 'DELETE' }
      ] },
      { name: 'CREATED_BY_USER_ID', type: 'number', required: true, disabled: false },
      { name: 'CREATED_DATE', type: 'date', required: true, disabled: true }
    ],
    idField: 'SERVICE_ID',
    hasRowActions: true,
    rowActions: ['serviceParams', 'serviceStepMapping'],
    fieldLookups: {
      'Service Provider': {
        lookupTable: 'SERVICE_PROVIDER',
        foreignKey: 'SERVICE_PROVIDER_ID',
        displayField: 'SERVICE_PROVIDER_NAME',
        displayFormat: '{SERVICE_PROVIDER_ID}: {SERVICE_PROVIDER_NAME}'
      }
    },
    ...createCrudFunctions('SERVICE', client, {
      'Service Provider': {
        lookupTable: 'SERVICE_PROVIDER',
        foreignKey: 'SERVICE_PROVIDER_ID',
        displayField: 'SERVICE_PROVIDER_NAME',
        displayFormat: '{SERVICE_PROVIDER_ID}: {SERVICE_PROVIDER_NAME}'
      }
    })
  },
  {
    name: 'SERVICE_PROVIDER',
    fields: ['SERVICE_PROVIDER_ID', 'SERVICE_PROVIDER_NAME', 'CREATED_BY_USER_ID', 'CREATED_DATE', 'CHANGED_BY_USER_ID', 'CHANGED_DATE'],
    formFields: [
      { name: 'SERVICE_PROVIDER_NAME', type: 'text', required: true, disabled: false },
      { name: 'CREATED_BY_USER_ID', type: 'number', required: true, disabled: false },
      { name: 'CREATED_DATE', type: 'date', required: true, disabled: true }
    ],
    idField: 'SERVICE_PROVIDER_ID',
    ...createCrudFunctions('SERVICE_PROVIDER', client)
  },
  {
    name: 'SERVICE_PARAM',
    fields: ['SERVICE_PARAM_ID', 'SERVICE_ID', 'PARAM_NAME', 'CREATED_BY_USER_ID', 'CREATED_DATE', 'CHANGED_BY_USER_ID', 'CHANGED_DATE'],
    formFields: [
      { name: 'SERVICE_ID', type: 'select', required: true, disabled: false, options: [] },
      { name: 'PARAM_NAME', type: 'text', required: true, disabled: false },
      { name: 'CREATED_BY_USER_ID', type: 'number', required: true, disabled: false },
      { name: 'CREATED_DATE', type: 'date', required: true, disabled: true }
    ],
    idField: 'SERVICE_PARAM_ID',
    hasFilters: true,
    filterType: 'service',
    autoFillFromFilter: { filterField: 'selectedServiceFilter', formField: 'SERVICE_ID' },
    ...createCrudFunctions('SERVICE_PARAM', client)
  },
  {
    name: 'SERVICE_PARAM_MAPPING',
    fields: ['SERVICE_PARAM_MAPPING_ID', 'ORIGIN_PRODUCT_ID', 'SOURCE_SERVICE_PARAM_ID', 'TARGET_SERVICE_PARAM_ID', 'CREATED_BY_USER_ID', 'CREATED_DATE'],
    formFields: [
      { name: 'ORIGIN_PRODUCT_ID', type: 'number', required: true, disabled: false },
      { name: 'SYSTEM_NBR', type: 'text', required: false, disabled: false },
      { name: 'PRIN_NBR', type: 'text', required: false, disabled: false },
      { name: 'AGENT_NBR', type: 'text', required: false, disabled: false },
      { name: 'SOURCE_SERVICE_PARAM_ID', type: 'number', required: true, disabled: false },
      { name: 'TARGET_SERVICE_PARAM_ID', type: 'number', required: true, disabled: false },
      { name: 'CREATED_BY_USER_ID', type: 'number', required: true, disabled: false },
      { name: 'CREATED_DATE', type: 'date', required: true, disabled: true }
    ],
    idField: 'SERVICE_PARAM_MAPPING_ID',
    ...createCrudFunctions('SERVICE_PARAM_MAPPING', client)
  },
  {
    name: 'REDIRECT_URL',
    fields: ['REDIRECT_URL_ID', 'PRODUCT_ID', 'URL_TYPE_CODE', 'URL', 'RESPONSE_TEXT', 'CREATED_BY_USER_ID', 'CREATED_DATE', 'CHANGED_BY_USER_ID', 'CHANGED_DATE'],
    formFields: [
      { name: 'ORIGIN_PRODUCT_ID', type: 'select', required: true, disabled: false, options: [] },
      { name: 'URL_TYPE_CODE', type: 'select', required: true, disabled: false, options: [
        { value: 'N', label: 'New' },
        { value: 'E', label: 'Existing' }
      ] },
      { name: 'URL', type: 'text', required: true, disabled: false },
      { name: 'RESPONSE_TEXT', type: 'text', required: false, disabled: false },
      { name: 'CREATED_BY_USER_ID', type: 'number', required: true, disabled: false },
      { name: 'CREATED_DATE', type: 'date', required: true, disabled: true }
    ],
    idField: 'REDIRECT_URL_ID',
    hasFilters: true,
    filterType: 'product',
    autoFillFromFilter: { filterField: 'selectedProductFilter', formField: 'ORIGIN_PRODUCT_ID' },
    loadFunction: async () => {
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
      
      return {
        data: {
          listREDIRECT_URLS: {
            items: enhancedUrls
          }
        }
      };
    },
    createFunction: async (input) => {
      return await client.graphql({ query: mutations.createRedirectUrl(), variables: { input } });
    },
    updateFunction: async (input) => {
      return await client.graphql({ query: mutations.updateRedirectUrl(), variables: { input } });
    },
    deleteFunction: async (input) => {
      return await client.graphql({ query: mutations.deleteRedirectUrl(), variables: { input } });
    }
  },
  {
    name: 'STEP_TYPE',
    fields: ['STEP_TYPE_ID', 'STEP_TYPE_NAME', 'STEP_TYPE_DESC', 'RESOURCE_NAME', 'CREATED_BY_USER_ID', 'CREATED_DATE', 'CHANGED_BY_USER_ID', 'CHANGED_DATE'],
    formFields: [
      { name: 'STEP_TYPE_NAME', type: 'text', required: true, disabled: false },
      { name: 'STEP_TYPE_DESC', type: 'text', required: false, disabled: false },
      { name: 'RESOURCE_NAME', type: 'text', required: true, disabled: false },
      { name: 'CREATED_BY_USER_ID', type: 'number', required: true, disabled: false },
      { name: 'CREATED_DATE', type: 'date', required: true, disabled: true }
    ],
    idField: 'STEP_TYPE_ID',
    hasRowActions: true,
    rowActions: ['stepServices'],
    ...createCrudFunctions('STEP_TYPE', client)
  },
  {
    name: 'STEP_SERVICE_MAPPING',
    fields: ['STEP_SERVICE_MAPPING_ID', 'STEP_TYPE', 'SERVICE', 'SEQUENCE_NBR'],
    formFields: [
      { name: 'STEP_TYPE_ID', type: 'select', required: true, disabled: false, options: [] },
      { name: 'SERVICE_ID', type: 'select', required: true, disabled: false, options: [] },
      { name: 'SEQUENCE_NBR', type: 'number', required: false, disabled: false }
    ],
    idField: 'STEP_SERVICE_MAPPING_ID',
    ...createCrudFunctions('STEP_SERVICE_MAPPING', client)
  }
];