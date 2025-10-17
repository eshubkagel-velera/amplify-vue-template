import { ref, computed } from 'vue';
import * as queries from '../graphql/queries.js';

export function useHelperFilters() {
  const helperFilterData = ref({});
  const helperFilterLookups = ref(new Map());
  const cascadingData = ref(new Map());

  const loadHelperFilterData = async (entityConfig, client) => {
    if (!entityConfig.helperFilters) return;

    console.log('Loading helper filter data for:', entityConfig.name, entityConfig.helperFilters);

    try {
      // Get unique sources from helper filters
      const sources = [...new Set(entityConfig.helperFilters.map(f => f.source))];
      console.log('Sources to load:', sources);
      
      // Load data for each source
      const promises = sources.map(async (source) => {
        const queryName = `list${source.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join('')}s`;
        const dataKey = `list${source}S`;
        
        if (queries[queryName]) {
          const result = await client.graphql({ query: queries[queryName] });
          return { source, items: result.data[dataKey]?.items || [] };
        }
        return { source, items: [] };
      });

      const results = await Promise.all(promises);
      
      // Create lookup maps for each helper filter
      entityConfig.helperFilters.forEach(filter => {
        const sourceData = results.find(r => r.source === filter.source);
        if (sourceData) {
          const lookupMap = new Map();
          sourceData.items.forEach(item => {
            lookupMap.set(item[filter.valueField], item[filter.displayField]);
          });
          helperFilterLookups.value.set(filter.name, lookupMap);
          console.log(`Loaded ${lookupMap.size} items for ${filter.name}`);
          
          // Store cascading data if needed
          if (filter.dependsOn) {
            cascadingData.value.set(filter.name, sourceData.items);
            console.log(`Stored ${sourceData.items.length} cascading items for ${filter.name}`);
          }
        }
      });
    } catch (error) {
      console.error('Failed to load helper filter data:', error);
    }
  };

  const getHelperFilterOptions = (filter) => {
    // Handle cascading dropdowns
    if (filter.dependsOn) {
      const parentValue = helperFilterData.value[filter.dependsOn];
      if (!parentValue) return [];
      
      const items = cascadingData.value.get(filter.name) || [];
      const filteredItems = items.filter(item => {
        const parentField = filter.parentField || 'SERVICE_ID';
        return item[parentField] === parseInt(parentValue);
      });
      
      return filteredItems.map(item => ({
        value: item[filter.valueField],
        label: `${item[filter.valueField]}: ${item[filter.displayField]}`
      }));
    }

    // Regular dropdown
    const lookupMap = helperFilterLookups.value.get(filter.name);
    if (lookupMap) {
      return Array.from(lookupMap.entries()).map(([value, display]) => ({
        value,
        label: `${value}: ${display}`
      }));
    }
    
    return [];
  };

  const resetHelperFilters = () => {
    helperFilterData.value = {};
  };

  return {
    helperFilterData,
    helperFilterLookups,
    loadHelperFilterData,
    getHelperFilterOptions,
    resetHelperFilters
  };
}