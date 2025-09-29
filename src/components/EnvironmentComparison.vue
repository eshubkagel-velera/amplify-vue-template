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
          <div class="entity-container" ref="primaryContainer" @scroll="syncScroll('primary', $event)">
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
              :readonly="!canEditEnvironment(primaryEnvironment)"
              :hideActionButtons="true"
              :hideRowActions="true"
              :fieldDifferences="fieldDifferences"
              :comparisonMode="'primary'"
              :matchedPairs="matchedPairs"
              :unmatchedRecords="unmatchedPrimary"
              :otherEnvironment="compareEnvironment"
              :canAddToOther="canAddToEnvironment('primary')"
              @filterChanged="syncToCompare"
              @sortChanged="syncToCompare"
              @addToOtherEnvironment="handleAddToOther"
              @copyDifferencesToOther="handleCopyDifferences"
              @recordUpdated="handleRecordUpdated"
            />
          </div>
        </div>

        <div class="environment-column">
          <h3>{{ compareEnvironment.toUpperCase() }} (Compare)</h3>
          <div class="entity-container" ref="compareContainer" @scroll="syncScroll('compare', $event)">
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
              :readonly="!canEditEnvironment(compareEnvironment)"
              :hideActionButtons="true"
              :hideRowActions="true"
              :fieldDifferences="fieldDifferences"
              :comparisonMode="'compare'"
              :matchedPairs="matchedPairs"
              :unmatchedRecords="unmatchedCompare"
              :primaryData="primaryData"
              :syncFilters="syncFilters"
              :syncSort="syncSort"
              :otherEnvironment="primaryEnvironment"
              :canAddToOther="canAddToEnvironment('compare')"
              @addToOtherEnvironment="handleAddToOther"
              @copyDifferencesToOther="handleCopyDifferences"
              @recordUpdated="handleRecordUpdated"
            />
          </div>
        </div>
      </div>
    </div>

    <div v-else class="no-comparison">
      <p>Select an environment to compare with {{ primaryEnvironment.toUpperCase() }}</p>
    </div>
    
    <!-- Add to Other Environment Modal -->
    <div v-if="showAddToOtherModal" class="modal-overlay">
      <div class="modal-content">
        <h3>Add Record to {{ addToOtherData?.targetEnvironment?.toUpperCase() }}</h3>
        <p>Are you sure you want to add this record to {{ addToOtherData?.targetEnvironment?.toUpperCase() }}?</p>
        <div v-if="addToOtherData?.entity" class="record-preview">
          <h4>Record Details:</h4>
          <div v-for="formField in entityConfig?.formFields?.filter(f => !['CREATED_DATE', 'CREATED_BY_USER_ID'].includes(f.name)) || []" :key="formField.name" class="field-preview">
            <strong>{{ formField.name }}:</strong> {{ addToOtherData.entity[formField.name] }}
          </div>
          <div class="field-preview">
            <strong>CREATED_DATE:</strong> {{ getCurrentDateString() }}
          </div>
          <div class="form-group">
            <label for="createdByUser"><strong>CREATED_BY_USER_ID:</strong></label>
            <input id="createdByUser" v-model="createdByUserId" type="number" :disabled="userProfileId" />
          </div>
        </div>
        <div class="form-actions">
          <button @click="confirmAddToOther" class="btn-success">Yes, Add Record</button>
          <button @click="closeAddToOtherModal" class="btn-primary">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import EntityManager from './EntityManager.vue';
import { getClient } from '../client.js';
import { useAuth } from '../composables/useAuth';
import { fetchUserAttributes } from 'aws-amplify/auth';

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
const primaryContainer = ref(null);
const compareContainer = ref(null);
const isScrolling = ref(false);

const syncToCompare = (syncData) => {
  if (syncData.type === 'filter') {
    syncFilters.value = { ...syncData.filters };
  } else if (syncData.type === 'sort') {
    syncSort.value = { field: syncData.field, direction: syncData.direction };
  }
};

const syncScroll = (source, event) => {
  if (isScrolling.value) return;
  
  isScrolling.value = true;
  const sourceContainer = event.target;
  const targetContainer = source === 'primary' ? compareContainer.value : primaryContainer.value;
  
  if (targetContainer) {
    targetContainer.scrollTop = sourceContainer.scrollTop;
    targetContainer.scrollLeft = sourceContainer.scrollLeft;
  }
  
  setTimeout(() => {
    isScrolling.value = false;
  }, 10);
};

const canEditEnvironment = (env) => {
  const { isAdmin, isDeployment, isDeveloper } = useAuth();
  
  // Check if user can edit in the specified environment
  if (isAdmin.value || isDeployment.value) return true;
  if (isDeveloper.value && (env === 'dev' || env === 'test')) return true;
  
  return false;
};

const canAddToEnvironment = (mode) => {
  const targetEnv = mode === 'primary' ? props.compareEnvironment : props.primaryEnvironment;
  return canEditEnvironment(targetEnv);
};

const showAddToOtherModal = ref(false);
const addToOtherData = ref(null);
const createdByUserId = ref(1);
const userProfileId = ref(null);

const handleAddToOther = (data) => {
  console.log('Add to other environment:', data);
  addToOtherData.value = data;
  createdByUserId.value = userProfileId.value || 1;
  showAddToOtherModal.value = true;
};

const handleCopyDifferences = async (data) => {
  console.log('Copy differences to other environment:', data);
  
  try {
    const { entity, targetEnvironment } = data;
    const entityId = entity[props.entityConfig?.idField || 'id'];
    
    // Get the field differences for this entity
    const diffInfo = fieldDifferences.value.get(entityId);
    if (!diffInfo || diffInfo.differentFields.length === 0) {
      console.log('No differences to copy');
      return;
    }
    
    // Build update data with ALL required fields from the compare record
    const updateData = { ...diffInfo.compareRecord };
    
    // Override with the different field values from the source entity
    diffInfo.differentFields.forEach(field => {
      updateData[field] = entity[field];
    });
    
    // Add audit fields
    updateData.CHANGED_DATE = new Date().toISOString().split('T')[0];
    updateData.CHANGED_BY_USER_ID = 1;
    
    console.log('Updating record with differences:', updateData);
    
    // Use comparison client to update the record in target environment
    const { updateComparisonRecord } = await import('../utils/comparisonClient.js');
    await updateComparisonRecord(targetEnvironment, props.selectedEntity, updateData);
    
    console.log(`Successfully copied differences to ${targetEnvironment}`);
    
    // Refresh the comparison data without leaving the screen
    setTimeout(() => {
      window.location.reload();
    }, 1500);
    
  } catch (error) {
    console.error('Error copying differences:', error);
    alert(`Error copying differences: ${error.message}`);
  }
};

const closeAddToOtherModal = () => {
  showAddToOtherModal.value = false;
  addToOtherData.value = null;
  createdByUserId.value = 1;
};

const getCurrentDateString = () => {
  return new Date().toISOString().split('T')[0];
};

const confirmAddToOther = async () => {
  if (!addToOtherData.value) return;
  
  try {
    const { entity, targetEnvironment } = addToOtherData.value;
    
    // Build form data using only the form fields (same as normal add)
    const formData = {};
    props.entityConfig.formFields.forEach(field => {
      if (entity[field.name] !== undefined && entity[field.name] !== null) {
        formData[field.name] = entity[field.name];
      }
    });
    
    // Generate a new unique PRODUCT_ID to avoid duplicates
    if (formData.PRODUCT_ID) {
      formData.PRODUCT_ID = crypto.randomUUID();
      console.log('Generated new PRODUCT_ID:', formData.PRODUCT_ID);
    }
    
    // Add current date and user ID for audit fields
    const currentDate = new Date().toISOString().split('T')[0];
    formData.CREATED_DATE = currentDate;
    formData.CREATED_BY_USER_ID = userProfileId.value || 1;
    
    console.log('Adding record to target environment:', targetEnvironment);
    console.log('Form data being sent:', formData);
    
    // Use direct API call to target environment
    console.log('Creating record in target environment:', targetEnvironment);
    
    const { callExternalApi } = await import('../client.js');
    
    // Use the same approach as the comparison data loading
    const { createComparisonRecord } = await import('../utils/comparisonClient.js');
    const result = await createComparisonRecord(targetEnvironment, 'ORIGIN_PRODUCT', formData);
    
    console.log('Create result:', result);
    
    closeAddToOtherModal();
    console.log(`Successfully added record to ${targetEnvironment}`);
    
    // Refresh the comparison data to show the new record
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  } catch (error) {
    console.error('Error adding record to other environment:', error);
    
    let errorMsg = 'Failed to add record to other environment';
    if (error.errors && error.errors.length > 0) {
      errorMsg = error.errors.map(e => e.message).join('\n');
    } else if (error.message) {
      errorMsg = error.message;
    }
    
    console.log('Full error object:', JSON.stringify(error, null, 2));
    alert(`Error: ${errorMsg}`);
  }
};

const loadUserProfile = async () => {
  try {
    const attributes = await fetchUserAttributes();
    const profileValue = attributes.profile;
    if (profileValue && !isNaN(parseInt(profileValue))) {
      userProfileId.value = parseInt(profileValue);
    }
  } catch (error) {
    console.warn('Could not load user profile:', error);
  }
};

const handleRecordUpdated = () => {
  console.log('Record updated, re-analyzing differences');
  if (primaryData.value.length > 0 && compareData.value.length > 0) {
    analyzeDifferences();
  }
};

onMounted(async () => {
  await loadUserProfile();
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

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding-top: 300px;
  z-index: 1000;
}

.modal-content {
  background: var(--modal-bg, #fff);
  color: var(--text-color, #333);
  padding: 30px;
  border-radius: 8px;
  min-width: 400px;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
}

.record-preview {
  margin: 20px 0;
  padding: 15px;
  background: var(--bg-color, #f8f9fa);
  border-radius: 4px;
  border: 1px solid var(--border-color, #dee2e6);
}

.field-preview {
  margin: 5px 0;
  padding: 5px;
}

.form-actions {
  margin-top: 20px;
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.form-group {
  margin: 10px 0;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.form-group input {
  width: 100%;
  padding: 8px;
  border: 1px solid var(--border-color, #dee2e6);
  border-radius: 4px;
  background: var(--input-bg, #fff);
  color: var(--text-color, #333);
}
</style>