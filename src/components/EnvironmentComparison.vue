<template>
  <div class="environment-comparison">
    <div class="comparison-header">
      <h2>Environment Comparison: {{ primaryEnvironment.toUpperCase() }} vs {{ compareEnvironment.toUpperCase() }}</h2>
      <div v-if="differences.size > 0" class="differences-summary">
        <span class="diff-count">{{ differences.size }} records with differences</span>
      </div>
    </div>

    <div v-if="compareEnvironment" class="comparison-content">
      <div class="environment-columns">
        <div class="environment-column">
          <h3>{{ primaryEnvironment.toUpperCase() }} (Primary)</h3>
          <div class="entity-container">
            <EntityManager
              v-if="selectedEntity"
              :key="`primary-${primaryEnvironment}-${selectedEntity}`"
              :entityName="selectedEntity"
              :fields="filteredFields"
              :formFields="entityConfig?.formFields || []"
              :idField="entityConfig?.idField || 'id'"
              :loadFunction="entityConfig?.loadFunction"
              :createFunction="entityConfig?.createFunction"
              :updateFunction="entityConfig?.updateFunction"
              :deleteFunction="entityConfig?.deleteFunction"
              :readonly="true"
              :hideActionButtons="true"
              :hideRowActions="true"
              :fieldDifferences="fieldDifferences"
              :comparisonMode="'primary'"
              :matchedPairs="matchedPairs"
              :unmatchedRecords="unmatchedPrimary"
              @filterChanged="syncToCompare"
              @sortChanged="syncToCompare"
            />
          </div>
        </div>

        <div class="environment-column">
          <h3>{{ compareEnvironment.toUpperCase() }} (Compare)</h3>
          <div class="entity-container">
            <EntityManager
              v-if="selectedEntity"
              ref="compareEntityManager"
              :key="`compare-${compareEnvironment}-${selectedEntity}`"
              :entityName="selectedEntity"
              :fields="filteredFields"
              :formFields="entityConfig?.formFields || []"
              :idField="entityConfig?.idField || 'id'"
              :loadFunction="getCompareLoadFunction"
              :createFunction="entityConfig?.createFunction"
              :updateFunction="entityConfig?.updateFunction"
              :deleteFunction="entityConfig?.deleteFunction"
              :readonly="true"
              :hideActionButtons="true"
              :hideRowActions="true"
              :fieldDifferences="fieldDifferences"
              :comparisonMode="'compare'"
              :matchedPairs="matchedPairs"
              :unmatchedRecords="unmatchedCompare"
              :primaryData="primaryData"
              :syncFilters="syncFilters"
              :syncSort="syncSort"
            />
          </div>
        </div>
      </div>
    </div>

    <div v-else class="no-comparison">
      <p>Select an environment to compare with {{ primaryEnvironment.toUpperCase() }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import EntityManager from './EntityManager.vue';
import { getClient } from '../client.js';

const props = defineProps({
  primaryEnvironment: {
    type: String,
    required: true
  },
  selectedEntity: {
    type: String,
    required: true
  },
  entityConfig: {
    type: Object,
    required: true
  },
  compareEnvironment: {
    type: String,
    required: true
  }
});

const primaryData = ref([]);
const compareData = ref([]);
const differences = ref(new Map());

const getCompareLoadFunction = computed(() => {
  if (!props.compareEnvironment || !props.entityConfig?.loadFunction) return null;
  
  return async (params) => {
    try {
      const { loadComparisonData } = await import('../utils/comparisonClient.js');
      
      console.log('Loading comparison data for', props.selectedEntity, 'from', props.compareEnvironment);
      
      const result = await loadComparisonData(props.selectedEntity);
      
      console.log('Comparison loaded:', result?.data ? Object.values(result.data)[0]?.items?.length || 0 : 0, 'items from', props.compareEnvironment);
      
      // Store comparison data for difference analysis
      if (result?.data) {
        const dataKey = Object.keys(result.data)[0];
        compareData.value = result.data[dataKey]?.items || [];
        analyzeDifferences();
      }
      
      return result;
    } catch (error) {
      console.error('Comparison loading failed:', error);
      return { data: {} };
    }
  };
});

const fieldDifferences = ref(new Map());
const matchedPairs = ref([]);
const unmatchedPrimary = ref([]);
const unmatchedCompare = ref([]);

const filteredFields = computed(() => {
  const auditFields = ['CREATED_BY_USER_ID', 'CREATED_DATE', 'CHANGED_BY_USER_ID', 'CHANGED_DATE'];
  return (props.entityConfig?.fields || []).filter(field => 
    !auditFields.includes(field)
  );
});

const analyzeDifferences = () => {
  const ignoreFields = ['_ID', 'CREATED_BY_USER_ID', 'CREATED_DATE', 'CHANGED_BY_USER_ID', 'CHANGED_DATE'];
  const diffs = new Map();
  const fieldDiffs = new Map();
  
  // Calculate match percentage between two records
  const calculateMatch = (record1, record2) => {
    const relevantFields = Object.keys(record1)
      .filter(field => !ignoreFields.some(ignore => field.includes(ignore)));
    
    let matches = 0;
    const differentFields = [];
    
    relevantFields.forEach(field => {
      if (record1[field] === record2[field]) {
        matches++;
      } else {
        differentFields.push(field);
      }
    });
    
    const matchPercentage = (matches / relevantFields.length) * 100;
    return { matchPercentage, differentFields, totalFields: relevantFields.length };
  };
  
  // Find best matches for each primary record
  primaryData.value.forEach(primaryRecord => {
    const primaryId = primaryRecord[props.entityConfig?.idField || 'id'];
    let bestMatch = null;
    let bestMatchPercentage = 0;
    
    compareData.value.forEach(compareRecord => {
      const match = calculateMatch(primaryRecord, compareRecord);
      if (match.matchPercentage > bestMatchPercentage) {
        bestMatchPercentage = match.matchPercentage;
        bestMatch = { record: compareRecord, ...match };
      }
    });
    
    if (bestMatch && bestMatchPercentage >= 60) {
      const compareId = bestMatch.record[props.entityConfig?.idField || 'id'];
      console.log(`Record ${primaryId} matches Record ${compareId} at ${bestMatchPercentage.toFixed(1)}%`);
      
      // Always add to fieldDiffs for matched records, even if no differences
      fieldDiffs.set(primaryId, {
        compareId,
        differentFields: bestMatch.differentFields,
        primaryRecord,
        compareRecord: bestMatch.record
      });
      
      if (bestMatch.differentFields.length > 0) {
        diffs.set(primaryId, bestMatch.differentFields);
        console.log(`  Different fields:`);
        bestMatch.differentFields.forEach(field => {
          console.log(`    ${field}: ${props.primaryEnvironment}='${primaryRecord[field]}' vs ${props.compareEnvironment}='${bestMatch.record[field]}'`);
        });
      }
    } else {
      diffs.set(primaryId, ['NO_MATCH_FOUND']);
      console.log(`Record ${primaryId}: No match found in ${props.compareEnvironment} (best match: ${bestMatchPercentage.toFixed(1)}%)`);
      const relevantFields = Object.keys(primaryRecord).filter(field => 
        !ignoreFields.some(ignore => field.includes(ignore))
      );
      relevantFields.forEach(field => {
        console.log(`  ${field}: '${primaryRecord[field]}'`);
      });
    }
  });
  
  // Create matched pairs and unmatched lists
  const pairs = [];
  const usedCompareIds = new Set();
  const unmatched1 = [];
  const unmatched2 = [];
  
  primaryData.value.forEach(primaryRecord => {
    const primaryId = primaryRecord[props.entityConfig?.idField || 'id'];
    const diffInfo = fieldDiffs.get(primaryId);
    
    if (diffInfo) {
      pairs.push({
        primary: primaryRecord,
        compare: diffInfo.compareRecord,
        differentFields: diffInfo.differentFields
      });
      usedCompareIds.add(diffInfo.compareId);
    } else {
      unmatched1.push(primaryRecord);
    }
  });
  
  // Find unmatched compare records
  compareData.value.forEach(compareRecord => {
    const compareId = compareRecord[props.entityConfig?.idField || 'id'];
    if (!usedCompareIds.has(compareId)) {
      unmatched2.push(compareRecord);
    }
  });
  
  matchedPairs.value = pairs;
  unmatchedPrimary.value = unmatched1;
  unmatchedCompare.value = unmatched2;
  differences.value = diffs;
  fieldDifferences.value = fieldDiffs;
  console.log('Found differences:', differences.value.size, 'records with differences');
};

const loadComparisonData = () => {
  // Trigger data reload when comparison environment changes
  if (compareEnvironment.value) {
    console.log(`Loading comparison data for ${compareEnvironment.value}`);
  }
};

// Watch for primary data changes
watch(() => props.entityConfig?.loadFunction, async () => {
  if (props.entityConfig?.loadFunction) {
    try {
      const result = await props.entityConfig.loadFunction();
      if (result?.data) {
        const dataKey = Object.keys(result.data)[0];
        primaryData.value = result.data[dataKey]?.items || [];
        if (compareData.value.length > 0) {
          analyzeDifferences();
        }
      }
    } catch (error) {
      console.error('Error loading primary data for comparison:', error);
    }
  }
}, { immediate: true });

const syncFilters = ref({});
const syncSort = ref({ field: '', direction: 'asc' });

const syncToCompare = (syncData) => {
  if (syncData.type === 'filter') {
    syncFilters.value = { ...syncData.filters };
  } else if (syncData.type === 'sort') {
    syncSort.value = { field: syncData.field, direction: syncData.direction };
  }
};

onMounted(() => {
  console.log('Environment comparison mounted', {
    primary: props.primaryEnvironment,
    entity: props.selectedEntity
  });
});
</script>

<style scoped>
.environment-comparison {
  padding: 20px;
  height: 100%;
}

.comparison-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border-color, #dee2e6);
}

.environment-selector {
  display: flex;
  align-items: center;
  gap: 10px;
}

.environment-selector label {
  font-weight: bold;
}

.environment-selector select {
  padding: 8px;
  border: 1px solid var(--border-color, #dee2e6);
  border-radius: 4px;
  background: var(--input-bg, #fff);
  color: var(--text-color, #333);
}

.comparison-content {
  height: calc(100vh - 300px);
  overflow: hidden;
}

.environment-columns {
  display: flex;
  gap: 20px;
  height: 100%;
}

.environment-column {
  flex: 1;
  border: 1px solid var(--border-color, #dee2e6);
  border-radius: 4px;
  overflow: hidden;
}

.environment-column h3 {
  margin: 0;
  padding: 10px;
  background: var(--table-header-bg, #f8f9fa);
  border-bottom: 1px solid var(--border-color, #dee2e6);
  text-align: center;
}

.entity-container {
  height: calc(100% - 50px);
  overflow: auto;
}

.no-comparison {
  text-align: center;
  padding: 40px;
  color: var(--text-color, #666);
}

.differences-summary {
  margin-top: 10px;
}

.diff-count {
  background: #ffc107;
  color: #212529;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: bold;
  font-size: 14px;
}

.placeholder-message {
  text-align: center;
  padding: 40px;
  color: var(--text-color, #666);
  border: 1px dashed var(--border-color, #dee2e6);
  background: var(--bg-color, #f8f9fa);
}
</style>