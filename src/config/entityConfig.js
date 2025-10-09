import * as queries from '../graphql/queries';
import * as mutations from '../graphql/mutations';
import { fetchAllPages } from '../utils/pagination.js';
import { getEntityConfig, getAllEntityConfigs } from './entityConfigLoader.js';

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
      const result = await client.graphql({ query: mutations[`create${mutationBase}`], variables: { input } });
      if (result.errors && result.errors.length > 0) {
        throw new Error(result.errors[0].message);
      }
      return result;
    },
    updateFunction: async (input) => {
      const result = await client.graphql({ query: mutations[`update${mutationBase}`], variables: { input } });
      if (result.errors && result.errors.length > 0) {
        throw new Error(result.errors[0].message);
      }
      return result;
    },
    deleteFunction: async (input) => {
      const result = await client.graphql({ query: mutations[`delete${mutationBase}`], variables: { input } });
      if (result.errors && result.errors.length > 0) {
        throw new Error(result.errors[0].message);
      }
      return result;
    }
  };
};

// Legacy entity configurations with CRUD functions
export const getEntityConfigs = (client) => {
  // Get all entity configurations dynamically
  const allEntityConfigs = getAllEntityConfigs();
  
  // Custom business logic for specific entities
  const customLogic = {
    'REDIRECT_URL': {
      loadFunction: async () => {
        try {
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
        } catch (error) {
          console.error('Error loading REDIRECT_URL data:', error);
          throw error;
        }
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
    }
  };
  
  // Combine all entity configs with custom logic and CRUD functions
  const allConfigs = [];
  
  Object.keys(allEntityConfigs).forEach(entityName => {
    const entityConfig = allEntityConfigs[entityName];
    const customConfig = customLogic[entityName] || {};
    
    // Merge entity config with custom logic and add CRUD functions
    const mergedConfig = {
      ...entityConfig,
      ...customConfig,
      ...createCrudFunctions(entityName, client, entityConfig.fieldLookups)
    };
    
    allConfigs.push(mergedConfig);
  });
  
  return allConfigs;
};

// Export new configuration system
export { getEntityConfig, getAllEntityConfigs };