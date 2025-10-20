<template>
  <div class="environment-comparison">
    <div class="comparison-header">
      <h2>Environment Comparison: {{ primaryEnvironment.toUpperCase() }} vs {{ compareEnvironment.toUpperCase() }}</h2>
      <div v-if="filteredDifferences > 0" class="differences-summary">
        <span class="diff-count">{{ filteredDifferences }} records with differences</span>
      </div>
    </div>

    <!-- Service Filter for SERVICE_PARAM -->
    <div v-if="compareEnvironment && selectedEntity === 'SERVICE_PARAM'" class="service-filter-section">
      <div v-if="allPrimaryServices.length > 0" class="filter-group">
        <label for="serviceFilter">Filter by Service:</label>
        <select id="serviceFilter" v-model="selectedServiceFilter" @change="applyServiceFilter">
          <option value="">-- All Services --</option>
          <option v-for="service in allPrimaryServices" :key="service.SERVICE_ID" :value="service.SERVICE_ID" :disabled="!serviceExistsInCompare(service.SERVICE_ID)">
            {{ service['Service Provider'] }}: {{ service.URI }}{{ !serviceExistsInCompare(service.SERVICE_ID) ? ' (not in ' + compareEnvironment.toUpperCase() + ')' : '' }}
          </option>
        </select>
      </div>
      <div v-else class="no-common-services">
        <p>No services found in primary environment.</p>
      </div>
    </div>

    <!-- Product Filter for REDIRECT_URL -->
    <div v-if="compareEnvironment && selectedEntity === 'REDIRECT_URL'" class="product-filter-section">
      <div v-if="allPrimaryProducts.length > 0" class="filter-group">
        <label for="productFilter">Filter by Product:</label>
        <select id="productFilter" v-model="selectedProductFilter" @change="applyProductFilter">
          <option value="">-- All Products --</option>
          <option v-for="product in allPrimaryProducts" :key="product.PRODUCT_ID" :value="product.PRODUCT_ID" :disabled="!productExistsInCompare(product.PRODUCT_ID)">
            {{ product.PRODUCT_ID }}: {{ product.VENDOR_NAME }} - {{ product.PRODUCT_DESC }}{{ !productExistsInCompare(product.PRODUCT_ID) ? ' (not in ' + compareEnvironment.toUpperCase() + ')' : '' }}
          </option>
        </select>
      </div>
      <div v-else class="no-common-products">
        <p>No products found in primary environment.</p>
      </div>
    </div>

    <div v-if="compareEnvironment" class="comparison-content">
      <!-- Show message for SERVICE_PARAM when no service is selected -->
      <div v-if="selectedEntity === 'SERVICE_PARAM' && !selectedServiceFilter" class="no-service-selected">
        <p>Please select a service from the filter above to view SERVICE_PARAM comparisons.</p>
      </div>
      
      <div v-else class="unified-table-container">
        <!-- Bulk Actions for SERVICE_PARAM -->
        <div v-if="selectedEntity === 'SERVICE_PARAM' && selectedServiceFilter" class="bulk-actions-container">
          <div class="bulk-actions bulk-actions-primary">
            <button @click="bulkAddToCompare" :disabled="selectedPrimaryRows.length === 0" class="btn-success">Add Selected to {{ compareEnvironment.toUpperCase() }}</button>
            <span class="selection-count">{{ selectedPrimaryRows.length }} primary selected</span>
          </div>
          <div class="bulk-actions bulk-actions-compare">
            <button @click="bulkAddToPrimary" :disabled="selectedCompareRows.length === 0" class="btn-success">Add Selected to {{ primaryEnvironment.toUpperCase() }}</button>
            <span class="selection-count">{{ selectedCompareRows.length }} compare selected</span>
          </div>
        </div>
        
        <table class="unified-comparison-table">
          <thead>
            <tr class="environment-header">
              <th v-if="selectedEntity === 'SERVICE_PARAM' && selectedServiceFilter" class="checkbox-header">Select</th>
              <th :colspan="filteredFields.length + 1" class="primary-env-header">{{ primaryEnvironment.toUpperCase() }}</th>
              <th v-if="selectedEntity === 'SERVICE_PARAM' && selectedServiceFilter" class="checkbox-header">Select</th>
              <th :colspan="filteredFields.length + 1" class="compare-env-header">{{ compareEnvironment.toUpperCase() }}</th>
            </tr>
            <tr class="field-header">
              <th v-if="selectedEntity === 'SERVICE_PARAM' && selectedServiceFilter" class="checkbox-header">
                <input type="checkbox" @change="toggleSelectAllPrimary" :checked="allPrimarySelected" :indeterminate="somePrimarySelected">
              </th>
              <th class="actions-header">Actions</th>
              <th v-for="field in filteredFields" :key="`primary-${field}`" class="primary-field">{{ field }}</th>
              <th v-if="selectedEntity === 'SERVICE_PARAM' && selectedServiceFilter" class="checkbox-header">
                <input type="checkbox" @change="toggleSelectAllCompare" :checked="allCompareSelected" :indeterminate="someCompareSelected">
              </th>
              <th class="actions-header">Actions</th>
              <th v-for="field in filteredFields" :key="`compare-${field}`" class="compare-field">{{ field }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in unifiedRows" :key="index" :class="getUnifiedRowClass(row)">
              <td v-if="selectedEntity === 'SERVICE_PARAM' && selectedServiceFilter" class="checkbox-cell">
                <input v-if="row.primary && !row.primary.__isBlank && (!row.compare || row.compare.__isBlank)" type="checkbox" :value="getPrimaryRowId(row)" v-model="selectedPrimaryRows">
              </td>
              <td class="actions-cell">
                <button v-if="row.primary && !row.primary.__isBlank" @click="editRecord(row.primary, 'primary')" class="btn-primary">
                  {{ (entityConfig?.copyOnEditWithMappings && hasEntityMappings(row.primary)) ? 'Copy & Edit' : 'Edit' }}
                </button>
                <button v-if="row.primary && !row.primary.__isBlank && (!row.compare || row.compare.__isBlank)" @click="addToOther(row.primary, compareEnvironment)" class="btn-success">Add to {{ compareEnvironment.toUpperCase() }}</button>
                <button v-if="row.primary && !row.primary.__isBlank && row.compare && !row.compare.__isBlank && hasDifferences(row.primary)" @click="copyToOther(row.primary, compareEnvironment)" class="btn-warning">Copy to {{ compareEnvironment.toUpperCase() }}</button>
              </td>
              <td v-for="field in filteredFields" :key="`primary-${field}`" :class="getCellClass(row, field, 'primary')" class="primary-cell">
                <span v-if="row.primary && !row.primary.__isBlank">{{ formatFieldValue(row.primary, field) }}</span>
                <span v-else class="blank-cell">—</span>
              </td>
              <td v-if="selectedEntity === 'SERVICE_PARAM' && selectedServiceFilter" class="checkbox-cell">
                <input v-if="row.compare && !row.compare.__isBlank && (!row.primary || row.primary.__isBlank)" type="checkbox" :value="getCompareRowId(row)" v-model="selectedCompareRows">
              </td>
              <td class="actions-cell">
                <button v-if="row.compare && !row.compare.__isBlank" @click="editRecord(row.compare, 'compare')" class="btn-primary">
                  {{ (entityConfig?.copyOnEditWithMappings && hasEntityMappings(row.compare)) ? 'Copy & Edit' : 'Edit' }}
                </button>
                <button v-if="row.compare && !row.compare.__isBlank && (!row.primary || row.primary.__isBlank)" @click="addToOther(row.compare, primaryEnvironment)" class="btn-success">Add to {{ primaryEnvironment.toUpperCase() }}</button>
                <button v-if="row.compare && !row.compare.__isBlank && row.primary && !row.primary.__isBlank && hasDifferences(row.compare)" @click="copyToOther(row.compare, primaryEnvironment)" class="btn-warning">Copy to {{ primaryEnvironment.toUpperCase() }}</button>
              </td>
              <td v-for="field in filteredFields" :key="`compare-${field}`" :class="getCellClass(row, field, 'compare')" class="compare-cell">
                <span v-if="row.compare && !row.compare.__isBlank">{{ formatFieldValue(row.compare, field) }}</span>
                <span v-else class="blank-cell">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-else class="no-comparison">
      <p>Select an environment to compare with {{ primaryEnvironment.toUpperCase() }}</p>
    </div>
    
    <!-- Edit Modal -->
    <div v-if="showEditModal" class="modal-overlay">
      <div class="modal-content edit-modal">
        <h3>Edit {{ selectedEntity }} Record</h3>
        <div class="edit-form">
          <div v-for="formField in entityConfig?.formFields?.filter(f => !['CREATED_DATE', 'CREATED_BY_USER_ID'].includes(f.name)) || []" :key="formField.name" class="form-group">
            <label :for="formField.name">{{ formField.name }}:</label>
            <select 
              v-if="formField.type === 'select'"
              :id="formField.name" 
              v-model="editFormData[formField.name]" 
              :disabled="formField.name === 'CHANGED_DATE'"
              class="form-input"
            >
              <option value="">-- Select {{ formField.name }} --</option>
              <option v-for="option in getEditFieldOptions(formField.name)" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
            <input 
              v-else
              :id="formField.name" 
              v-model="editFormData[formField.name]" 
              :type="formField.name.includes('DATE') ? 'date' : (formField.type || 'text')"
              :disabled="formField.name.includes('_ID') && formField.name !== 'PSCU_CLIENT_ID' || formField.name === 'CHANGED_DATE'"
              class="form-input"
            />
          </div>
          <div v-if="entityConfig?.formFields?.some(f => f.name === 'CHANGED_BY_USER_ID')" class="form-group">
            <label for="changedByUserId">CHANGED_BY_USER_ID:</label>
            <input 
              id="changedByUserId" 
              v-model="editFormData.CHANGED_BY_USER_ID" 
              type="number"
              :disabled="userProfileId"
              class="form-input"
            />
          </div>
        </div>
        <div class="form-actions">
          <button @click="saveEditRecord" class="btn-success">Save Changes</button>
          <button @click="closeEditModal" class="btn-primary">Cancel</button>
        </div>
      </div>
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

    <!-- Copy Differences Modal -->
    <div v-if="showCopyDifferencesModal" class="modal-overlay">
      <div class="modal-content">
        <h3>Copy Differences to {{ copyDifferencesData?.targetEnvironment?.toUpperCase() }}</h3>
        <p>Copy {{ copyDifferencesData?.fieldsToUpdate?.length }} field difference(s) from {{ primaryEnvironment.toUpperCase() }} to {{ copyDifferencesData?.targetEnvironment?.toUpperCase() }}?</p>
        <div v-if="copyDifferencesData?.fieldsToUpdate" class="record-preview">
          <h4>Fields to update:</h4>
          <div v-for="field in copyDifferencesData.fieldsToUpdate" :key="field" class="field-preview">
            <strong>{{ field }}:</strong> 
            {{ formatFieldValue(copyDifferencesData.targetEnvironment === compareEnvironment ? 
                copyDifferencesData.diffInfo.primaryRecord : 
                copyDifferencesData.diffInfo.compareRecord, field) }}
          </div>
        </div>
        <div class="form-actions">
          <button @click="confirmCopyDifferences" class="btn-success">Yes, Copy Differences</button>
          <button @click="closeCopyDifferencesModal" class="btn-primary">Cancel</button>
        </div>
      </div>
    </div>

    <!-- Progress Modal -->
    <div v-if="showProgressModal" class="modal-overlay progress-overlay">
      <div class="modal-content">
        <h3>{{ progressData.operation }}</h3>
        <p>Processing {{ progressData.current }} of {{ progressData.total }} records...</p>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: (progressData.current / progressData.total * 100) + '%' }"></div>
        </div>
        <p class="progress-text">{{ Math.round(progressData.current / progressData.total * 100) }}% Complete</p>
      </div>
    </div>

    <!-- Grey overlay for progress -->
    <div v-if="showProgressModal" class="grey-overlay"></div>

    <!-- Success Modal -->
    <div v-if="showSuccessModal" class="modal-overlay">
      <div class="modal-content">
        <h3>{{ successMessage.includes('Error') || successMessage.includes('failed') ? 'Error' : 'Success' }}</h3>
        <p>{{ successMessage }}</p>
        <div class="form-actions">
          <button @click="closeSuccessModal" class="btn-primary">OK</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import EntityManager from './EntityManager.vue';
import { getClient } from '../client.js';
import { useAuth } from '../composables/useAuth';
import { fetchUserAttributes } from 'aws-amplify/auth';
import * as queries from '../graphql/queries.js';
import { createComparisonClient } from '../utils/comparisonClient.js';

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
const allPrimaryProducts = ref([]);
const compareProducts = ref([]);
const selectedProductFilter = ref('');
const allPrimaryServices = ref([]);
const compareServices = ref([]);
const selectedServiceFilter = ref('');
const allPrimaryStepTypes = ref([]);
const compareStepTypes = ref([]);
const allPrimaryServiceProviders = ref([]);
const compareServiceProviders = ref([]);
const allPrimaryServiceParams = ref([]);
const compareServiceParams = ref([]);
const selectedRows = ref([]);
const selectedPrimaryRows = ref([]);
const selectedCompareRows = ref([]);
const paramMappings = ref(new Map());

// Watch compareData changes
watch(compareData, (newVal) => {
  if (newVal.length > 0 && primaryData.value.length > 0) {
    analyzeDifferences();
  }
}, { deep: true });
const differences = ref(new Map());

const getCompareLoadFunction = computed(() => {
  if (!props.compareEnvironment || !props.entityConfig?.loadFunction) return null;
  
  return async (params) => {
    try {
      const { loadComparisonData } = await import('../utils/comparisonClient.js');
      
      // Set the comparison environment
      window.compareEnvironment = props.compareEnvironment;
      localStorage.setItem('compareEnvironment', props.compareEnvironment);
      
      const result = await loadComparisonData(props.selectedEntity);
      
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

const getCompareUpdateFunction = computed(() => {
  if (!props.compareEnvironment) return props.entityConfig?.updateFunction;
  
  return async (updateData) => {
    try {
      const { updateComparisonRecord } = await import('../utils/comparisonClient.js');
      return await updateComparisonRecord(props.compareEnvironment, props.selectedEntity, updateData);
    } catch (error) {
      console.error('Comparison update failed:', error);
      throw error;
    }
  };
});

const fieldDifferences = ref(new Map());
const matchedPairs = ref([]);
const unmatchedPrimary = ref([]);
const unmatchedCompare = ref([]);

const filteredFields = computed(() => {
  const auditFields = ['CREATED_BY_USER_ID', 'CREATED_DATE', 'CHANGED_BY_USER_ID', 'CHANGED_DATE'];
  const identityKey = `${props.selectedEntity}_ID`;
  
  // Use comparison-specific fields if available
  const fieldsToUse = props.entityConfig?.comparisonConfig?.comparisonFields || props.entityConfig?.fields || [];
  
  return fieldsToUse.filter(field => 
    !auditFields.includes(field) && field !== identityKey
  );
});

const analyzeDifferences = () => {
  
  // Global fields to exclude from all comparisons
  const baseExcludeFields = ['CREATED_BY_USER_ID', 'CREATED_DATE', 'CHANGED_BY_USER_ID', 'CHANGED_DATE'];
  const identityKey = `${props.selectedEntity}_ID`;
  const globalExcludeFields = [...baseExcludeFields, identityKey];
  
  // Use entity-specific comparison configuration
  const config = props.entityConfig?.comparisonConfig || {};
  
  const diffs = new Map();
  const fieldDiffs = new Map();
  
  // String similarity function using substring matching
  const calculateStringSimilarity = (str1, str2) => {
    if (!str1 || !str2) return 0;
    const s1 = String(str1).toLowerCase();
    const s2 = String(str2).toLowerCase();
    if (s1 === s2) return 1;
    
    // Find the shorter and longer strings
    const shorter = s1.length <= s2.length ? s1 : s2;
    const longer = s1.length > s2.length ? s1 : s2;
    
    // Check if shorter string is contained in longer string
    if (longer.includes(shorter)) {
      return shorter.length / longer.length;
    }
    
    // Find longest common substring
    let maxLength = 0;
    for (let i = 0; i < shorter.length; i++) {
      for (let j = i + 1; j <= shorter.length; j++) {
        const substring = shorter.substring(i, j);
        if (longer.includes(substring) && substring.length > maxLength) {
          maxLength = substring.length;
        }
      }
    }
    
    return maxLength / Math.max(s1.length, s2.length);
  };

  // Calculate match percentage between two records with entity-specific logic
  const calculateMatch = (record1, record2) => {
    
    // Determine fields to use for comparison
    let comparisonFields;
    if (config.comparisonFields) {
      comparisonFields = config.comparisonFields.filter(field => record1.hasOwnProperty(field));
    } else {
      comparisonFields = Object.keys(record1)
        .filter(field => !globalExcludeFields.some(exclude => field.includes(exclude)));
    }
    
    // Check if records should be matched based on matching fields
    if (config.matchingFields) {
      if (config.stringMatchFields && config.stringMatchThreshold) {
        // Use string similarity matching for specified fields
        let highestSimilarity = 0;
        let matchedByString = false;
        
        config.matchingFields.forEach(field => {
          if (config.stringMatchFields.includes(field)) {
            const similarity = calculateStringSimilarity(record1[field], record2[field]);
            highestSimilarity = Math.max(highestSimilarity, similarity);
            if (similarity >= config.stringMatchThreshold) {
              matchedByString = true;
            }
          } else {
            // Exact match for non-string fields
            if (record1[field] !== record2[field]) {
              return { matchPercentage: 0, differentFields: comparisonFields, totalFields: comparisonFields.length };
            }
          }
        });
        
        if (!matchedByString && highestSimilarity < config.stringMatchThreshold) {
          return { matchPercentage: Math.round(highestSimilarity * 100), differentFields: comparisonFields, totalFields: comparisonFields.length };
        }
        
      } else {
        // Check if all matching fields are identical
        const matchingFieldsMatch = config.matchingFields.every(field => record1[field] === record2[field]);
        
        if (!matchingFieldsMatch) {
          // Still calculate field differences even if matching fields don't match exactly
          let matches = 0;
          const differentFields = [];
          
          comparisonFields.forEach(field => {
            let val1 = record1[field];
            let val2 = record2[field];
            
            if (config.useDisplayValues && config.useDisplayValues[field]) {
              const displayField = config.useDisplayValues[field];
              let displayVal1 = record1[`${field}_DISPLAY`] || record1[displayField] || val1;
              let displayVal2 = record2[`${field}_DISPLAY`] || record2[displayField] || val2;
              
              if (displayVal1 && typeof displayVal1 === 'string' && displayVal1.includes(':')) {
                displayVal1 = displayVal1.split(':')[1].trim();
              }
              if (displayVal2 && typeof displayVal2 === 'string' && displayVal2.includes(':')) {
                displayVal2 = displayVal2.split(':')[1].trim();
              }
              
              val1 = displayVal1;
              val2 = displayVal2;
            }
            
            if (val1 === val2) {
              matches++;
            } else {
              differentFields.push(field);
            }
          });
          
          const matchPercentage = Math.round((matches / comparisonFields.length) * 100);
          return { matchPercentage, differentFields, totalFields: comparisonFields.length };
        }
      }
    } else {
      // Default PRODUCT_ID matching for entities without specific matching fields
      if (record1.PRODUCT_ID !== record2.PRODUCT_ID) {
        return { matchPercentage: 0, differentFields: comparisonFields, totalFields: comparisonFields.length };
      }
    }
    
    // Compare all fields to find differences
    let matches = 0;
    const differentFields = [];
    
    comparisonFields.forEach(field => {
      let val1 = record1[field];
      let val2 = record2[field];
      
      // Use display values for foreign key fields if configured
      if (config.useDisplayValues && config.useDisplayValues[field]) {
        const displayField = config.useDisplayValues[field];
        // Look for enhanced display field first, then fallback to lookup
        let displayVal1 = record1[`${field}_DISPLAY`] || record1[displayField] || val1;
        let displayVal2 = record2[`${field}_DISPLAY`] || record2[displayField] || val2;
        
        // Extract business value from display format "ID: Value"
        if (displayVal1 && typeof displayVal1 === 'string' && displayVal1.includes(':')) {
          displayVal1 = displayVal1.split(':')[1].trim();
        }
        if (displayVal2 && typeof displayVal2 === 'string' && displayVal2.includes(':')) {
          displayVal2 = displayVal2.split(':')[1].trim();
        }
        
        val1 = displayVal1;
        val2 = displayVal2;
      }
      
      if (val1 === val2) {
        matches++;
      } else {
        differentFields.push(field);
      }
    });
    
    return { matchPercentage: 100, differentFields, totalFields: comparisonFields.length };

  };
  
  // Calculate all possible matches above threshold
  const allPossibleMatches = [];
  
  primaryData.value.forEach(primaryRecord => {
    const primaryId = primaryRecord[props.entityConfig?.idField || 'id'];
    // console.log(`\n=== Processing primary record ${primaryId} ===`);
    
    compareData.value.forEach(compareRecord => {
      const compareId = compareRecord[props.entityConfig?.idField || 'id'];
      const match = calculateMatch(primaryRecord, compareRecord);
      
      if (match.matchPercentage >= 50) {
        allPossibleMatches.push({
          primaryId,
          compareId,
          primaryRecord,
          compareRecord,
          matchPercentage: match.matchPercentage,
          differentFields: match.differentFields
        });
      }
    });
  });
  
  // Sort by match percentage - 100% matches first, then by highest percentage
  allPossibleMatches.sort((a, b) => {
    if (a.matchPercentage === 100 && b.matchPercentage !== 100) return -1;
    if (b.matchPercentage === 100 && a.matchPercentage !== 100) return 1;
    return b.matchPercentage - a.matchPercentage;
  });
  
  // Separate perfect matches (100%) from partial matches
  const perfectMatches = allPossibleMatches.filter(m => m.matchPercentage === 100);
  const partialMatches = allPossibleMatches.filter(m => m.matchPercentage < 100);
  
  // For perfect matches, prioritize those with no field differences (truly identical)
  perfectMatches.sort((a, b) => {
    if (a.differentFields.length === 0 && b.differentFields.length > 0) return -1;
    if (b.differentFields.length === 0 && a.differentFields.length > 0) return 1;
    return a.differentFields.length - b.differentFields.length;
  });
  
  const usedPrimaryIds = new Set();
  const usedCompareIds = new Set();
  const selectedMatches = [];
  
  // First, process perfect matches with no differences (truly identical records)
  for (const match of perfectMatches.filter(m => m.differentFields.length === 0)) {
    if (!usedPrimaryIds.has(match.primaryId) && !usedCompareIds.has(match.compareId)) {
      selectedMatches.push(match);
      usedPrimaryIds.add(match.primaryId);
      usedCompareIds.add(match.compareId);
    }
  }
  
  // Then process remaining perfect matches (100% but with differences)
  for (const match of perfectMatches.filter(m => m.differentFields.length > 0)) {
    if (!usedPrimaryIds.has(match.primaryId) && !usedCompareIds.has(match.compareId)) {
      selectedMatches.push(match);
      usedPrimaryIds.add(match.primaryId);
      usedCompareIds.add(match.compareId);
    }
  }
  
  // Finally, process partial matches
  for (const match of partialMatches) {
    if (!usedPrimaryIds.has(match.primaryId) && !usedCompareIds.has(match.compareId)) {
      selectedMatches.push(match);
      usedPrimaryIds.add(match.primaryId);
      usedCompareIds.add(match.compareId);
    }
  }
  
  // Set field differences for all selected matches
  selectedMatches.forEach(match => {
    fieldDiffs.set(match.primaryId, {
      compareId: match.compareId,
      differentFields: match.differentFields,
      primaryRecord: match.primaryRecord,
      compareRecord: match.compareRecord
    });
    
    if (match.differentFields.length > 0) {
      diffs.set(match.primaryId, match.differentFields);
    }
  });
  
  // Log unmatched records
  primaryData.value.forEach(primaryRecord => {
    const primaryId = primaryRecord[props.entityConfig?.idField || 'id'];
    if (!usedPrimaryIds.has(primaryId)) {
      diffs.set(primaryId, ['NO_MATCH_FOUND']);
    }
  });
  
  // Create matched pairs and unmatched lists
  const pairs = [];
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
    } else {
      unmatched1.push(primaryRecord);
    }
  });
  
  // Find unmatched compare records
  const matchedCompareIds = new Set(Array.from(fieldDiffs.values()).map(diff => diff.compareId));
  
  compareData.value.forEach(compareRecord => {
    const compareId = compareRecord[props.entityConfig?.idField || 'id'];
    if (!matchedCompareIds.has(compareId)) {
      unmatched2.push(compareRecord);
    }
  });
  
  matchedPairs.value = pairs;
  unmatchedPrimary.value = unmatched1;
  unmatchedCompare.value = unmatched2;
  differences.value = diffs;
  fieldDifferences.value = fieldDiffs;
};

const loadCommonProducts = async () => {
  try {
    // Load products from primary environment
    const primaryResult = await props.entityConfig.loadFunction ? 
      await callPrimaryProductsApi() : null;
    
    // Load products from compare environment
    const { loadComparisonData } = await import('../utils/comparisonClient.js');
    const originalEnv = window.compareEnvironment;
    window.compareEnvironment = props.compareEnvironment;
    const compareResult = await loadComparisonData('ORIGIN_PRODUCT');
    window.compareEnvironment = originalEnv;
    
    if (primaryResult?.data) {
      allPrimaryProducts.value = primaryResult.data.listORIGIN_PRODUCTS?.items || [];
    }
    
    if (compareResult?.data) {
      compareProducts.value = compareResult.data.listORIGIN_PRODUCTS?.items || [];
    }
    

  } catch (error) {
    console.error('Error loading products:', error);
    allPrimaryProducts.value = [];
    compareProducts.value = [];
  }
};

const loadCommonServices = async () => {
  try {
    // Load services from primary environment
    const primaryResult = await callPrimaryServicesApi();
    
    // Load services from compare environment
    const { loadComparisonData } = await import('../utils/comparisonClient.js');
    const originalEnv = window.compareEnvironment;
    window.compareEnvironment = props.compareEnvironment;
    const compareResult = await loadComparisonData('SERVICE');
    window.compareEnvironment = originalEnv;
    
    if (primaryResult?.data) {
      allPrimaryServices.value = primaryResult.data.listSERVICES?.items || [];
    }
    
    if (compareResult?.data) {
      compareServices.value = compareResult.data.listSERVICES?.items || [];
    }
    

  } catch (error) {
    console.error('Error loading services:', error);
    allPrimaryServices.value = [];
    compareServices.value = [];
  }
};

const productExistsInCompare = (productId) => {
  return compareProducts.value.some(product => product.PRODUCT_ID === productId);
};

const loadCommonStepTypes = async () => {
  try {
    const { callExternalApi } = await import('../client.js');
    const environment = localStorage.getItem('selectedEnvironment') || 'dev';
    const primaryResult = await callExternalApi(environment, 'listSTEP_TYPES');
    
    const { loadComparisonData } = await import('../utils/comparisonClient.js');
    const originalEnv = window.compareEnvironment;
    window.compareEnvironment = props.compareEnvironment;
    const compareResult = await loadComparisonData('STEP_TYPE');
    window.compareEnvironment = originalEnv;
    
    if (primaryResult?.data) {
      allPrimaryStepTypes.value = primaryResult.data.listSTEP_TYPES?.items || [];
    }
    
    if (compareResult?.data) {
      compareStepTypes.value = compareResult.data.listSTEP_TYPES?.items || [];
    }
    

  } catch (error) {
    console.error('Error loading step types:', error);
    allPrimaryStepTypes.value = [];
    compareStepTypes.value = [];
  }
};

const serviceExistsInCompare = (serviceId) => {
  // Find the primary service by SERVICE_ID
  const primaryService = allPrimaryServices.value.find(service => service.SERVICE_ID === serviceId);
  if (!primaryService) return false;
  
  // Check if a service with matching Service Provider and URI exists in compare environment
  return compareServices.value.some(service => 
    service['Service Provider'] === primaryService['Service Provider'] &&
    service.URI === primaryService.URI
  );
};

const callPrimaryProductsApi = async () => {
  try {
    const { callExternalApi } = await import('../client.js');
    const environment = localStorage.getItem('selectedEnvironment') || 'dev';
    return await callExternalApi(environment, 'listORIGIN_PRODUCTS');
  } catch (error) {
    console.error('Error loading primary products:', error);
    return null;
  }
};

const callPrimaryServicesApi = async () => {
  try {
    const { callExternalApi } = await import('../client.js');
    const environment = localStorage.getItem('selectedEnvironment') || 'dev';
    
    // Load both services and providers
    const [servicesResult, providersResult] = await Promise.all([
      callExternalApi(environment, 'listSERVICES'),
      callExternalApi(environment, 'listSERVICE_PROVIDERS')
    ]);
    
    if (servicesResult?.data && providersResult?.data) {
      const services = servicesResult.data.listSERVICES?.items || [];
      const providers = providersResult.data.listSERVICE_PROVIDERS?.items || [];
      
      // Enhance services with provider names
      const enhancedServices = services.map(service => {
        const provider = providers.find(p => p.SERVICE_PROVIDER_ID === service.SERVICE_PROVIDER_ID);
        return {
          ...service,
          'Service Provider': provider ? provider.SERVICE_PROVIDER_NAME : service.SERVICE_PROVIDER_ID
        };
      });
      
      return {
        data: {
          listSERVICES: {
            items: enhancedServices
          }
        }
      };
    }
    
    return servicesResult;
  } catch (error) {
    console.error('Error loading primary services:', error);
    return null;
  }
};

const applyProductFilter = () => {
  // Set the product filter for both EntityManagers
  if (primaryEntityManager.value) {
    primaryEntityManager.value.selectedProductFilter = selectedProductFilter.value;
    primaryEntityManager.value.filterByProduct();
  }
  if (compareEntityManager.value) {
    compareEntityManager.value.selectedProductFilter = selectedProductFilter.value;
    compareEntityManager.value.filterByProduct();
  }
};

const applyServiceFilter = async () => {
  // Clear selections when changing service
  selectedRows.value = [];
  selectedPrimaryRows.value = [];
  selectedCompareRows.value = [];
  
  // Set global service filter
  window.selectedServiceFilter = selectedServiceFilter.value;
  
  // For comparison screen, reload data with service filter
  if (selectedServiceFilter.value && props.entityConfig?.loadFunction) {
    try {
      const result = await props.entityConfig.loadFunction();
      if (result?.data) {
        const dataKey = Object.keys(result.data)[0];
        primaryData.value = result.data[dataKey]?.items || [];
      }
    } catch (error) {
      console.error('Error reloading primary data with service filter:', error);
    }
  }
  
  // Reload compare data
  if (selectedServiceFilter.value && props.compareEnvironment) {
    try {
      const { loadComparisonData } = await import('../utils/comparisonClient.js');
      window.compareEnvironment = props.compareEnvironment;
      window.selectedServiceFilter = selectedServiceFilter.value;
      const result = await loadComparisonData(props.selectedEntity);
      
      if (result?.data) {
        const dataKey = Object.keys(result.data)[0];
        compareData.value = result.data[dataKey]?.items || [];
      }
    } catch (error) {
      console.error('Error reloading compare data with service filter:', error);
    }
  }
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
        const items = result.data[dataKey]?.items || [];
        primaryData.value = items;
        analyzeDifferences();
      }
    } catch (error) {
      console.error('Error loading primary data for comparison:', error);
    }
  }
}, { immediate: true });

// Watch for compare environment changes to load compare data
watch(() => props.compareEnvironment, async () => {
  // Clear existing data first
  compareData.value = [];
  matchedPairs.value = [];
  unmatchedPrimary.value = [];
  unmatchedCompare.value = [];
  differences.value = new Map();
  fieldDifferences.value = new Map();
  
  if (props.compareEnvironment) {
    try {
      const { loadComparisonData } = await import('../utils/comparisonClient.js');
      window.compareEnvironment = props.compareEnvironment;
      localStorage.setItem('compareEnvironment', props.compareEnvironment);
      
      const result = await loadComparisonData(props.selectedEntity);
      
      if (result?.data) {
        const dataKey = Object.keys(result.data)[0];
        const items = result.data[dataKey]?.items || [];
        compareData.value = items;
        
        if (primaryData.value.length > 0) {
          analyzeDifferences();
        }
      }
    } catch (error) {
      console.error('Error loading compare data:', error);
      compareData.value = [];
    }
  }
}, { immediate: true });

// Watch for entity or environment changes to load products and services
watch([() => props.selectedEntity, () => props.compareEnvironment], async () => {
  if (props.compareEnvironment) {
    await loadCommonProducts();
    await loadCommonServices();
    await loadCommonStepTypes();
    await loadCommonServiceProviders();
    await loadCommonServiceParams();
  }
}, { immediate: true });

const syncFilters = ref({});
const syncSort = ref({ field: '', direction: 'asc' });
const primaryEntityManager = ref(null);
const compareEntityManager = ref(null);

const syncToCompare = (syncData) => {
  if (syncData.type === 'filter') {
    syncFilters.value = { ...syncData.filters };
  } else if (syncData.type === 'sort') {
    syncSort.value = { field: syncData.field, direction: syncData.direction };
  }
};

const unifiedRows = computed(() => {
  const rows = [];
  
  // First, add all matched pairs
  matchedPairs.value.forEach(pair => {
    rows.push({
      primary: pair.primary,
      compare: pair.compare
    });
  });
  
  // Then add unmatched primary records
  unmatchedPrimary.value.forEach(primaryRecord => {
    rows.push({
      primary: primaryRecord,
      compare: { __isBlank: true }
    });
  });
  
  // Finally add unmatched compare records
  unmatchedCompare.value.forEach(compareRecord => {
    rows.push({
      primary: { __isBlank: true },
      compare: compareRecord
    });
  });
  
  // Apply product filter for REDIRECT_URL
  if (props.selectedEntity === 'REDIRECT_URL' && selectedProductFilter.value) {
    return rows.filter(row => {
      const primaryMatch = !row.primary?.__isBlank && row.primary?.PRODUCT_ID === selectedProductFilter.value;
      const compareMatch = !row.compare?.__isBlank && row.compare?.PRODUCT_ID === selectedProductFilter.value;
      return primaryMatch || compareMatch;
    });
  }
  
  // Apply service filter for SERVICE_PARAM
  if (props.selectedEntity === 'SERVICE_PARAM' && selectedServiceFilter.value) {
    return rows.filter(row => {
      const primaryMatch = !row.primary?.__isBlank && row.primary?.SERVICE_ID === selectedServiceFilter.value;
      
      // For compare records, check if they belong to the equivalent service in compare environment
      let compareMatch = false;
      if (!row.compare?.__isBlank && row.compare?.SERVICE_ID) {
        // Find the primary service
        const primaryService = allPrimaryServices.value.find(s => s.SERVICE_ID === selectedServiceFilter.value);
        if (primaryService) {
          // Find the equivalent service in compare environment
          const compareService = compareServices.value.find(s => 
            s['Service Provider'] === primaryService['Service Provider'] && s.URI === primaryService.URI
          );
          if (compareService) {
            compareMatch = row.compare.SERVICE_ID === compareService.SERVICE_ID;
          }
        }
      }
      
      return primaryMatch || compareMatch;
    });
  }
  
  return rows;
});

const formatFieldValue = (record, field) => {
  if (!record) return '';
  
  // Handle static lookup options (like URL_TYPE_CODE) - applies to all environments
  if (props.entityConfig?.fieldLookups?.[field]?.options) {
    const options = props.entityConfig.fieldLookups[field].options;
    const value = record[field];
    if (options.hasOwnProperty(value)) {
      return options[value];
    }
  }
  
  // Use comparison display field mapping for both environments in comparison mode (highest priority)
  if (props.compareEnvironment && props.entityConfig?.comparisonConfig?.displayFieldMapping?.[field]) {
    const displayField = `${field}_DISPLAY`;
    
    // Always try to extract from display field first
    if (record[displayField]) {
      const displayValue = record[displayField];
      if (displayValue.includes(':')) {
        const extracted = displayValue.split(':')[1].trim();
        console.log(`Extracted ${field}: '${displayValue}' -> '${extracted}'`);
        return extracted;
      }
      console.log(`No colon in ${field}: '${displayValue}'`);
      return displayValue;
    }
    
    // Check if raw field value is in display format (ID: Value)
    const rawValue = record[field];
    if (rawValue && typeof rawValue === 'string' && rawValue.includes(':')) {
      const extracted = rawValue.split(':')[1].trim();
      console.log(`Extracted from raw ${field}: '${rawValue}' -> '${extracted}'`);
      return extracted;
    }
    
    console.log(`No display field for ${field}, using raw value:`, rawValue);
    return rawValue || '';
  }
  
  // Use enhanced display field if available (for single entity screens)
  const displayField = `${field}_DISPLAY`;
  if (record[displayField]) {
    return record[displayField];
  }
  
  const value = record[field];
  if (field.includes('DATE') && value) {
    return new Date(value).toLocaleDateString();
  }
  return value || '';
};

const getUnifiedRowClass = (row) => {
  if (row.primary?.__isBlank && row.compare?.__isBlank) return 'both-blank';
  if (row.primary?.__isBlank) return 'primary-missing';
  if (row.compare?.__isBlank) return 'compare-missing';
  return 'both-present';
};

const getCellClass = (row, field, side) => {
  const record = row[side];
  if (!record || record.__isBlank) return 'blank-cell';
  
  const otherSide = side === 'primary' ? 'compare' : 'primary';
  const otherRecord = row[otherSide];
  
  if (!otherRecord || otherRecord.__isBlank) return '';
  
  // Use the same comparison logic as formatFieldValue for display consistency
  const val1 = formatFieldValue(record, field);
  const val2 = formatFieldValue(otherRecord, field);
  
  if (val1 !== val2) {
    return 'field-different';
  }
  
  return '';
};

const editRecord = (record, environment) => {
  // Find the enhanced record with display fields from the appropriate data source
  const isCompareEnv = environment === 'compare';
  const sourceData = isCompareEnv ? compareData.value : primaryData.value;
  const entityIdField = props.entityConfig?.idField || 'id';
  const recordId = record[entityIdField];
  
  // Find the enhanced record that should have _DISPLAY fields
  const enhancedRecord = sourceData.find(r => r[entityIdField] === recordId) || record;
  
  handleEditRecord({ entity: enhancedRecord, environment, entityType: props.selectedEntity });
};

const handleEditRecord = async (data) => {
  editingEntity.value = { ...data.entity, environment: data.environment };
  
  showEditModal.value = true;
  
  // Create clean form data, excluding computed fields and ensuring proper JSON structure
  editFormData.value = {};
  Object.keys(data.entity).forEach(key => {
    if (!['Service Provider'].includes(key)) {
      const value = data.entity[key];
      // For ID fields, extract the numeric ID from display strings like "98: VENDOR_NAME"
      if (key.includes('_ID') && value !== null && value !== undefined) {
        if (typeof value === 'string' && value.includes(':')) {
          // Extract ID from display format "ID: Name"
          const idPart = value.split(':')[0].trim();
          editFormData.value[key] = parseInt(idPart);
        } else if (!isNaN(value)) {
          editFormData.value[key] = parseInt(value);
        } else {
          editFormData.value[key] = value;
        }
      } else {
        // Ensure we have clean, serializable values
        editFormData.value[key] = value === null || value === undefined ? '' : String(value);
      }
    }
  });
  
  // Wait for next tick to ensure template is rendered and options are available
  await nextTick();
  
  // Set CHANGED_DATE and CHANGED_BY_USER_ID with proper defaults
  if (props.entityConfig?.formFields?.some(f => f.name === 'CHANGED_DATE')) {
    editFormData.value.CHANGED_DATE = getCurrentDateString();
  }
  if (props.entityConfig?.formFields?.some(f => f.name === 'CHANGED_BY_USER_ID')) {
    editFormData.value.CHANGED_BY_USER_ID = userProfileId.value || 1;
  }
};

const closeEditModal = () => {
  showEditModal.value = false;
  editingEntity.value = null;
  editFormData.value = {};
};

const saveEditRecord = async () => {
  try {
    const isUpdate = editFormData.value[props.entityConfig?.idField] !== undefined;
    
    // For entities with copyOnEditWithMappings and mappings, create new record instead of update
    if (props.entityConfig?.copyOnEditWithMappings && isUpdate && hasEntityMappings(editingEntity.value)) {
      const cleanData = { ...editFormData.value };
      
      // Remove ID field and audit fields for create operation
      delete cleanData[props.entityConfig.idField];
      delete cleanData.CHANGED_BY_USER_ID;
      delete cleanData.CHANGED_DATE;
      
      // Remove entity-specific fields
      if (props.entityConfig.fieldsToRemove) {
        props.entityConfig.fieldsToRemove.forEach(field => {
          delete cleanData[field];
        });
      }
      
      // Set create fields
      cleanData.CREATED_DATE = new Date().toISOString().split('T')[0];
      cleanData.CREATED_BY_USER_ID = userProfileId.value || 1;
      
      // Convert number fields
      if (cleanData.SERVICE_ID) cleanData.SERVICE_ID = parseInt(cleanData.SERVICE_ID);
      if (cleanData.CREATED_BY_USER_ID) cleanData.CREATED_BY_USER_ID = parseInt(cleanData.CREATED_BY_USER_ID);
      

      
      const isCompareEnvironment = editingEntity.value.environment === 'compare';
      let result;
      
      if (isCompareEnvironment) {
        const { createComparisonRecord } = await import('../utils/comparisonClient.js');
        result = await createComparisonRecord(props.compareEnvironment, props.selectedEntity, cleanData);
      } else {
        result = await props.entityConfig.createFunction(cleanData);
      }
      
      if (result && !result.errors) {
        closeEditModal();
        await handleRecordUpdated();
        successMessage.value = `New ${props.selectedEntity} created (original has mappings)!`;
        showSuccessModal.value = true;
      } else {
        console.error('Create failed:', result?.errors || 'Unknown error');
        successMessage.value = `Create failed: ${result?.errors?.[0]?.message || 'Unknown error'}`;
        showSuccessModal.value = true;
      }
      return;
    }
    
    // Regular update logic
    const cleanData = {};
    Object.keys(editFormData.value).forEach(key => {
      const value = editFormData.value[key];
      if (value !== null && value !== undefined && value !== '') {
        if (key.includes('_ID') && !isNaN(value)) {
          cleanData[key] = parseInt(value);
        } else {
          cleanData[key] = String(value).trim();
        }
      }
    });
    
    // Remove entity-specific fields for updates
    if (props.entityConfig.fieldsToRemove) {
      props.entityConfig.fieldsToRemove.forEach(field => {
        delete cleanData[field];
      });
    }
    delete cleanData.CREATED_BY_USER_ID;
    delete cleanData.CREATED_DATE;
    
    cleanData.CHANGED_DATE = new Date().toISOString().split('T')[0];
    if (cleanData.CHANGED_BY_USER_ID) {
      cleanData.CHANGED_BY_USER_ID = parseInt(cleanData.CHANGED_BY_USER_ID);
    }
    
    const isCompareEnvironment = editingEntity.value.environment === 'compare';
    let result;
    
    if (isCompareEnvironment) {
      const { updateComparisonRecord } = await import('../utils/comparisonClient.js');
      result = await updateComparisonRecord(props.compareEnvironment, props.selectedEntity, cleanData);
    } else {
      result = await props.entityConfig.updateFunction(cleanData);
    }
    
    if (result && !result.errors) {
      closeEditModal();
      await handleRecordUpdated();
      successMessage.value = 'Record updated successfully!';
      showSuccessModal.value = true;
    } else {
      console.error('Update failed:', result?.errors || 'Unknown error');
      successMessage.value = `Update failed: ${result?.errors?.[0]?.message || 'Unknown error'}`;
      showSuccessModal.value = true;
    }
  } catch (error) {
    console.error('Error updating record:', error);
    successMessage.value = `Error updating record: ${error.message}`;
    showSuccessModal.value = true;
  }
};

const addToOther = (record, targetEnvironment) => {
  handleAddToOther({ entity: record, targetEnvironment });
};

const hasDifferences = (record) => {
  const recordId = record[props.entityConfig?.idField || 'id'];
  
  // Check if this record has actual field differences (not just a match)
  const diffInfo = fieldDifferences.value.get(recordId);
  if (diffInfo) {
    return diffInfo.differentFields.length > 0;
  }
  
  // If not found, check if this is a compare record by finding its matched pair
  for (const pair of matchedPairs.value) {
    if (pair.compare && pair.compare[props.entityConfig?.idField || 'id'] === recordId) {
      const primaryId = pair.primary[props.entityConfig?.idField || 'id'];
      const primaryDiffInfo = fieldDifferences.value.get(primaryId);
      return primaryDiffInfo && primaryDiffInfo.differentFields.length > 0;
    }
  }
  
  return false;
};

const copyToOther = (record, targetEnvironment) => {
  handleCopyDifferences({ entity: record, targetEnvironment });
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
const showEditModal = ref(false);
const editingEntity = ref(null);
const editFormData = ref({});
const showCopyDifferencesModal = ref(false);
const copyDifferencesData = ref(null);
const showSuccessModal = ref(false);
const successMessage = ref('');
const showProgressModal = ref(false);
const progressData = ref({ current: 0, total: 0, operation: '' });

const handleAddToOther = (data) => {
  addToOtherData.value = data;
  createdByUserId.value = userProfileId.value || 1;
  showAddToOtherModal.value = true;
};

const handleCopyDifferences = async (data) => {
  try {
    const { entity, targetEnvironment } = data;
    const entityId = entity[props.entityConfig?.idField || 'id'];
    
    // Get the field differences for this entity
    let diffInfo = fieldDifferences.value.get(entityId);
    
    // If not found directly, check if this is a compare record by finding its matched pair
    if (!diffInfo) {
      for (const pair of matchedPairs.value) {
        if (pair.compare && pair.compare[props.entityConfig?.idField || 'id'] === entityId) {
          const primaryId = pair.primary[props.entityConfig?.idField || 'id'];
          diffInfo = fieldDifferences.value.get(primaryId);
          break;
        }
      }
    }
    
    if (!diffInfo || diffInfo.differentFields.length === 0) {
      successMessage.value = 'No differences found to copy for this record';
      showSuccessModal.value = true;
      return;
    }
    
    // Show confirmation modal with proper source values
    copyDifferencesData.value = {
      entity,
      targetEnvironment,
      diffInfo,
      fieldsToUpdate: diffInfo.differentFields
    };
    showCopyDifferencesModal.value = true;
    return;
  } catch (error) {
    console.error('Error copying differences:', error);
    successMessage.value = `Error copying differences: ${error.message}`;
    showSuccessModal.value = true;
  }
};

const confirmCopyDifferences = async () => {
  try {
    const { entity, targetEnvironment, diffInfo } = copyDifferencesData.value;
    
    // Determine which record to use as the base for the update
    let targetRecord, sourceRecord;
    
    if (targetEnvironment === props.compareEnvironment) {
      // Copying from primary to compare
      targetRecord = diffInfo.compareRecord;
      sourceRecord = diffInfo.primaryRecord;
    } else {
      // Copying from compare to primary
      targetRecord = diffInfo.primaryRecord;
      sourceRecord = diffInfo.compareRecord;
    }
    
    // Build update data with ALL required fields from the target record
    const updateData = { ...targetRecord };
    
    // Extract numeric IDs from any display format fields in the base data
    Object.keys(updateData).forEach(key => {
      if (key.includes('_ID') && typeof updateData[key] === 'string' && updateData[key].includes(':')) {
        updateData[key] = parseInt(updateData[key].split(':')[0].trim());
      }
    });
    
    // Override with the different field values from the source record
    for (const field of diffInfo.differentFields) {
      // Skip fields that should preserve destination values
      const preserveFields = props.entityConfig?.preserveOnCopy || [];
      if (preserveFields.includes(field)) {
        continue;
      }
      
      let value = sourceRecord[field];
      
      // Handle foreign key mapping for cross-environment updates
      if (field.includes('_ID') && field !== props.entityConfig?.idField && props.entityConfig?.foreignKeys?.[field]) {
        const foreignKeyConfig = props.entityConfig.foreignKeys[field];
        const displayField = foreignKeyConfig.displayField;
        
        // Extract display value from source record
        let displayValue = value;
        
        // First try to get display value from _DISPLAY field
        const sourceDisplayField = `${field}_DISPLAY`;
        if (sourceRecord[sourceDisplayField]) {
          if (typeof sourceRecord[sourceDisplayField] === 'string' && sourceRecord[sourceDisplayField].includes(':')) {
            displayValue = sourceRecord[sourceDisplayField].split(':')[1].trim();
          } else {
            displayValue = sourceRecord[sourceDisplayField];
          }
        } else if (typeof value === 'string' && value.includes(':')) {
          displayValue = value.split(':')[1].trim();
        }
        
        // Load target environment data for the foreign key table
        let foundTargetId = null;
        try {
          const { loadComparisonData } = await import('../utils/comparisonClient.js');
          const originalEnv = window.compareEnvironment;
          window.compareEnvironment = targetEnvironment;
          const targetResult = await loadComparisonData(foreignKeyConfig.table);
          window.compareEnvironment = originalEnv;
          
          if (targetResult?.data) {
            const dataKey = Object.keys(targetResult.data)[0];
            const targetData = targetResult.data[dataKey]?.items || [];
            
            // Find matching record by display field
            const targetRecord = targetData.find(record => record[displayField] === displayValue);
            if (targetRecord) {
              foundTargetId = targetRecord[foreignKeyConfig.valueField];
            }
          }
        } catch (error) {
          console.error(`Failed to load ${foreignKeyConfig.table} data for mapping:`, error);
        }
        
        // If no matching record found, try auto-create if configured
        if (!foundTargetId && props.entityConfig.autoCreateForeignKeys?.[field]) {
          const config = props.entityConfig.autoCreateForeignKeys[field];
          try {
            foundTargetId = await ensureForeignKeyExists(field, sourceRecord[field], config, targetEnvironment);
          } catch (error) {
            console.error(`Failed to auto-create ${field}:`, error);
          }
        }
        
        // Use found target ID or keep original value
        value = foundTargetId || value;
        
        // If still no value found, keep the original source value
        if (!value) {
          value = sourceRecord[field];
        }
      } else if (field.includes('_ID') && typeof value === 'string' && value.includes(':')) {
        // Extract numeric ID from display format for non-foreign key ID fields
        value = parseInt(value.split(':')[0].trim());
      }
      
      updateData[field] = value;
    }
    
    // Remove CREATED fields from updates
    delete updateData.CREATED_BY_USER_ID;
    delete updateData.CREATED_DATE;
    
    // Always remove CHANGED_BY_USER_ID for FILTER_CRITERIA (not supported in schema)
    if (props.selectedEntity === 'FILTER_CRITERIA') {
      delete updateData.CHANGED_BY_USER_ID;
    }
    
    // Remove fields specified in entity configuration
    const fieldsToRemove = props.entityConfig?.fieldsToRemove || [];
    fieldsToRemove.forEach(field => {
      delete updateData[field];
    });
    
    // Remove display fields that shouldn't be sent to GraphQL
    Object.keys(updateData).forEach(key => {
      if (key.endsWith('_DISPLAY')) {
        delete updateData[key];
      }
    });
    
    // Ensure SEQUENCE_NBR is an integer
    if (updateData.SEQUENCE_NBR && typeof updateData.SEQUENCE_NBR === 'string') {
      updateData.SEQUENCE_NBR = parseInt(updateData.SEQUENCE_NBR);
    }
    
    // Remove PRODUCT_ID for REDIRECT_URL updates (not accepted by schema)
    if (props.selectedEntity === 'REDIRECT_URL') {
      delete updateData.PRODUCT_ID;
    }
    
    // Add audit fields
    updateData.CHANGED_DATE = new Date().toISOString().split('T')[0];
    if (props.entityConfig?.formFields?.some(f => f.name === 'CHANGED_BY_USER_ID')) {
      updateData.CHANGED_BY_USER_ID = userProfileId.value || 1;
    }
    
    // Final cleanup - remove fields specified in entity configuration
    const cleanUpdateData = { ...updateData };
    const finalFieldsToRemove = props.entityConfig?.fieldsToRemove || [];
    finalFieldsToRemove.forEach(field => {
      delete cleanUpdateData[field];
    });
    
    // Also remove any display fields
    Object.keys(cleanUpdateData).forEach(key => {
      if (key.endsWith('_DISPLAY')) {
        delete cleanUpdateData[key];
      }
    });
    

    
    // Use comparison client to update the record in target environment
    const { updateComparisonRecord } = await import('../utils/comparisonClient.js');
    await updateComparisonRecord(targetEnvironment, props.selectedEntity, cleanUpdateData);
    

    
    closeCopyDifferencesModal();
    
    // Immediately refresh data
    await handleRecordUpdated();
    
    // Show success modal after refresh
    successMessage.value = `Successfully copied ${diffInfo.differentFields.length} field difference(s) to ${targetEnvironment.toUpperCase()}`;
    showSuccessModal.value = true;
    
  } catch (error) {
    console.error('Error copying differences:', error);
    successMessage.value = `Error copying differences: ${error.message}`;
    showSuccessModal.value = true;
  }
};

const closeAddToOtherModal = () => {
  showAddToOtherModal.value = false;
  addToOtherData.value = null;
  createdByUserId.value = 1;
};

const closeCopyDifferencesModal = () => {
  showCopyDifferencesModal.value = false;
  copyDifferencesData.value = null;
};

const closeSuccessModal = () => {
  showSuccessModal.value = false;
  successMessage.value = '';
};

const getCurrentDateString = () => {
  return new Date().toISOString().split('T')[0];
};

const formatDateForDisplay = (date) => {
  const d = new Date(date);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const year = d.getFullYear();
  return `${month}/${day}/${year}`;
};

const confirmAddToOther = async () => {
  if (!addToOtherData.value) return;
  
  try {
    const { entity, targetEnvironment } = addToOtherData.value;
    
    // Build form data using only the form fields (same as normal add)
    const formData = {};
    props.entityConfig.formFields.forEach(field => {
      if (entity[field.name] !== undefined && entity[field.name] !== null) {
        let value = entity[field.name];
        // Extract numeric ID from display format "ID: Name"
        if (field.name.includes('_ID') && typeof value === 'string' && value.includes(':')) {
          value = parseInt(value.split(':')[0].trim());
        }
        formData[field.name] = value;
      }
    });
    
    // For REDIRECT_URL, find matching ORIGIN_PRODUCT_ID in target environment
    if (props.selectedEntity === 'REDIRECT_URL' && formData.ORIGIN_PRODUCT_ID) {
      try {
        const { loadComparisonData } = await import('../utils/comparisonClient.js');
        const originalEnv = window.compareEnvironment;
        window.compareEnvironment = targetEnvironment;
        const targetProducts = await loadComparisonData('ORIGIN_PRODUCT');
        window.compareEnvironment = originalEnv;
        
        // Find product with same PRODUCT_ID in target environment
        const sourceProduct = primaryData.value.find(p => p.ORIGIN_PRODUCT_ID === formData.ORIGIN_PRODUCT_ID);
        if (sourceProduct && targetProducts?.data?.listORIGIN_PRODUCTS?.items) {
          const targetProduct = targetProducts.data.listORIGIN_PRODUCTS.items.find(p => 
            p.PRODUCT_ID === sourceProduct.PRODUCT_ID
          );
          if (targetProduct) {
            formData.ORIGIN_PRODUCT_ID = targetProduct.ORIGIN_PRODUCT_ID;
          }
        }
      } catch (error) {
        console.warn('Could not find matching ORIGIN_PRODUCT_ID in target environment:', error);
      }
    }
    
    // Keep the same PRODUCT_ID when copying ORIGIN_PRODUCT to maintain consistency
    // The PRODUCT_ID should remain the same across environments
    
    // For SERVICE entities, validate that the service provider exists in target environment
    if (props.selectedEntity === 'SERVICE' && formData.SERVICE_PROVIDER_ID) {
      try {
        const { loadComparisonData } = await import('../utils/comparisonClient.js');
        const originalEnv = window.compareEnvironment;
        window.compareEnvironment = targetEnvironment;
        const targetProviders = await loadComparisonData('SERVICE_PROVIDER');
        window.compareEnvironment = originalEnv;
        
        // Find the source provider name
        const sourceProvider = primaryData.value.find(s => s.SERVICE_PROVIDER_ID === formData.SERVICE_PROVIDER_ID);
        const sourceProviderName = sourceProvider?.['Service Provider'];
        
        if (sourceProviderName && targetProviders?.data?.listSERVICE_PROVIDERS?.items) {
          const targetProvider = targetProviders.data.listSERVICE_PROVIDERS.items.find(p => 
            p.SERVICE_PROVIDER_NAME === sourceProviderName
          );
          
          if (!targetProvider) {
            throw new Error(`Service Provider '${sourceProviderName}' does not exist in ${targetEnvironment.toUpperCase()}. Please create the service provider first.`);
          }
          
          // Update the SERVICE_PROVIDER_ID to match the target environment
          formData.SERVICE_PROVIDER_ID = targetProvider.SERVICE_PROVIDER_ID;
        }
      } catch (error) {
        if (error.message.includes('does not exist')) {
          throw error;
        }
        console.warn('Could not validate service provider:', error);
      }
    }
    
    // Auto-create missing foreign key records if configured
    if (props.entityConfig.autoCreateForeignKeys) {
      for (const [fieldName, config] of Object.entries(props.entityConfig.autoCreateForeignKeys)) {
        if (formData[fieldName]) {
          const newId = await ensureForeignKeyExists(fieldName, formData[fieldName], config, targetEnvironment);
          if (newId) {
            formData[fieldName] = newId;
          }
        }
      }
    }
    
    // Add current date and user ID for audit fields
    const currentDate = new Date().toISOString().split('T')[0];
    formData.CREATED_DATE = currentDate;
    formData.CREATED_BY_USER_ID = userProfileId.value || 1;
    
    const { createComparisonRecord } = await import('../utils/comparisonClient.js');
    const result = await createComparisonRecord(targetEnvironment, props.selectedEntity, formData);
    
    // Check for errors in the result
    if (result.errors && result.errors.length > 0) {
      throw new Error(result.errors.map(e => e.message).join('; '));
    }
    
    if (!result.data) {
      throw new Error('No data returned from create operation');
    }
    
    // Check if the create operation actually returned the created record
    const createKey = Object.keys(result.data)[0];
    const createdRecord = result.data[createKey];
    
    if (!createdRecord) {
      throw new Error('Create operation failed - no record data returned');
    }
    
    // For SERVICE_PARAM, the ID field is SERVICE_PARAM_ID
    const idField = props.selectedEntity === 'SERVICE_PARAM' ? 'SERVICE_PARAM_ID' : (props.entityConfig?.idField || 'SERVICE_ID');
    
    // Check for negative ID which indicates failure (except -1 which is our Aurora VTL placeholder)
    if (createdRecord[idField] && createdRecord[idField] < 0 && createdRecord[idField] !== -1) {
      let errorMsg = `Create operation failed - received invalid ID: ${createdRecord[idField]}`;
      if (props.selectedEntity === 'SERVICE') {
        errorMsg += '. This usually means the SERVICE_PROVIDER_ID does not exist in the target environment.';
      }
      throw new Error(errorMsg);
    }
    
    closeAddToOtherModal();
    
    // Immediately refresh data
    await handleRecordUpdated();
    
    // Show success message after refresh
    const recordName = formData.SERVICE_PROVIDER_NAME || formData.SERVICE_NAME || 'record';
    successMessage.value = `Successfully added "${recordName}" to ${targetEnvironment.toUpperCase()}!`;
    showSuccessModal.value = true;
  } catch (error) {
    console.error('Error adding record to other environment:', error);
    
    let errorMsg = 'Failed to add record to other environment';
    if (error.errors && error.errors.length > 0) {
      errorMsg = error.errors.map(e => e.message).join('\n');
    } else if (error.message) {
      errorMsg = error.message;
    }
    
    successMessage.value = `Error: ${errorMsg}`;
    showSuccessModal.value = true;
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

const hasEntityMappings = (record) => {
  if (!record || !props.entityConfig?.copyOnEditWithMappings) return false;
  
  if (props.selectedEntity === 'SERVICE_PARAM') {
    const paramId = record[props.entityConfig.idField];
    return paramMappings.value.get(paramId) > 0;
  }
  
  return false;
};

const checkParameterMappings = async () => {
  if (props.selectedEntity !== 'SERVICE_PARAM') return;
  
  try {
    const { getClient } = await import('../client.js');
    const result = await getClient().graphql({ query: queries.listServiceParamMappings });
    const mappings = result.data.listSERVICE_PARAM_MAPPINGS?.items || [];
    const mappingCounts = new Map();
    
    mappings.forEach(mapping => {
      const sourceId = mapping.SOURCE_SERVICE_PARAM_ID;
      const targetId = mapping.TARGET_SERVICE_PARAM_ID;
      
      mappingCounts.set(sourceId, (mappingCounts.get(sourceId) || 0) + 1);
      mappingCounts.set(targetId, (mappingCounts.get(targetId) || 0) + 1);
    });
    
    paramMappings.value = mappingCounts;
  } catch (error) {
    console.error('Failed to check parameter mappings:', error);
  }
};

const handleRecordUpdated = async () => {
  // Reload primary data
  if (props.entityConfig?.loadFunction) {
    try {
      const result = await props.entityConfig.loadFunction();
      if (result?.data) {
        const dataKey = Object.keys(result.data)[0];
        primaryData.value = result.data[dataKey]?.items || [];
      }
    } catch (error) {
      console.error('Error reloading primary data:', error);
    }
  }
  
  // Always reload compare data
  try {
    const { loadComparisonData } = await import('../utils/comparisonClient.js');
    window.compareEnvironment = props.compareEnvironment;
    const result = await loadComparisonData(props.selectedEntity);
    
    if (result?.data) {
      const dataKey = Object.keys(result.data)[0];
      compareData.value = result.data[dataKey]?.items || [];
    }
  } catch (error) {
    console.error('Error reloading compare data:', error);
  }
  
  // Re-analyze differences with fresh data
  if (primaryData.value.length >= 0 && compareData.value.length >= 0) {
    analyzeDifferences();
  }
}

const loadCommonServiceProviders = async () => {
  try {
    const { callExternalApi } = await import('../client.js');
    const environment = localStorage.getItem('selectedEnvironment') || 'dev';
    const primaryResult = await callExternalApi(environment, 'listSERVICE_PROVIDERS');
    
    const { loadComparisonData } = await import('../utils/comparisonClient.js');
    const originalEnv = window.compareEnvironment;
    window.compareEnvironment = props.compareEnvironment;
    const compareResult = await loadComparisonData('SERVICE_PROVIDER');
    window.compareEnvironment = originalEnv;
    
    if (primaryResult?.data) {
      allPrimaryServiceProviders.value = primaryResult.data.listSERVICE_PROVIDERS?.items || [];
    }
    
    if (compareResult?.data) {
      compareServiceProviders.value = compareResult.data.listSERVICE_PROVIDERS?.items || [];
    }
    

  } catch (error) {
    console.error('Error loading service providers:', error);
    allPrimaryServiceProviders.value = [];
    compareServiceProviders.value = [];
  }
};

const loadCommonServiceParams = async () => {
  try {
    const { callExternalApi } = await import('../client.js');
    const environment = localStorage.getItem('selectedEnvironment') || 'dev';
    const primaryResult = await callExternalApi(environment, 'listSERVICE_PARAMS');
    
    const { loadComparisonData } = await import('../utils/comparisonClient.js');
    const originalEnv = window.compareEnvironment;
    window.compareEnvironment = props.compareEnvironment;
    const compareResult = await loadComparisonData('SERVICE_PARAM');
    window.compareEnvironment = originalEnv;
    
    if (primaryResult?.data) {
      allPrimaryServiceParams.value = primaryResult.data.listSERVICE_PARAMS?.items || [];
    }
    
    if (compareResult?.data) {
      compareServiceParams.value = compareResult.data.listSERVICE_PARAMS?.items || [];
    }
    

  } catch (error) {
    console.error('Error loading service params:', error);
    allPrimaryServiceParams.value = [];
    compareServiceParams.value = [];
  }
};

onMounted(async () => {
  await loadUserProfile();
  if (props.compareEnvironment) {
    await loadCommonProducts();
    await loadCommonServices();
    await loadCommonStepTypes();
    await loadCommonServiceProviders();
    await loadCommonServiceParams();
  }
  if (props.selectedEntity === 'SERVICE_PARAM') {
    await checkParameterMappings();
  }
});



const allSelected = computed(() => {
  const availableRows = unifiedRows.value.filter(row => row.primary && !row.primary.__isBlank);
  return availableRows.length > 0 && selectedRows.value.length === availableRows.length;
});

const someSelected = computed(() => {
  return selectedRows.value.length > 0 && !allSelected.value;
});

const allPrimarySelected = computed(() => {
  const availableRows = unifiedRows.value.filter(row => row.primary && !row.primary.__isBlank && (!row.compare || row.compare.__isBlank));
  return availableRows.length > 0 && selectedPrimaryRows.value.length === availableRows.length;
});

const somePrimarySelected = computed(() => {
  return selectedPrimaryRows.value.length > 0 && !allPrimarySelected.value;
});

const allCompareSelected = computed(() => {
  const availableRows = unifiedRows.value.filter(row => row.compare && !row.compare.__isBlank && (!row.primary || row.primary.__isBlank));
  return availableRows.length > 0 && selectedCompareRows.value.length === availableRows.length;
});

const someCompareSelected = computed(() => {
  return selectedCompareRows.value.length > 0 && !allCompareSelected.value;
});

const getRowId = (row) => {
  return row.primary[props.entityConfig?.idField || 'id'];
};

const getPrimaryRowId = (row) => {
  return row.primary[props.entityConfig?.idField || 'id'];
};

const getCompareRowId = (row) => {
  return row.compare[props.entityConfig?.idField || 'id'];
};

const toggleSelectAll = () => {
  const availableRows = unifiedRows.value.filter(row => row.primary && !row.primary.__isBlank);
  if (allSelected.value) {
    selectedRows.value = [];
  } else {
    selectedRows.value = availableRows.map(row => getRowId(row));
  }
};

const toggleSelectAllPrimary = () => {
  const availableRows = unifiedRows.value.filter(row => row.primary && !row.primary.__isBlank && (!row.compare || row.compare.__isBlank));
  if (allPrimarySelected.value) {
    selectedPrimaryRows.value = [];
  } else {
    selectedPrimaryRows.value = availableRows.map(row => getPrimaryRowId(row));
  }
};

const toggleSelectAllCompare = () => {
  const availableRows = unifiedRows.value.filter(row => row.compare && !row.compare.__isBlank && (!row.primary || row.primary.__isBlank));
  if (allCompareSelected.value) {
    selectedCompareRows.value = [];
  } else {
    selectedCompareRows.value = availableRows.map(row => getCompareRowId(row));
  }
};

const bulkAddToCompare = async () => {
  if (selectedPrimaryRows.value.length === 0) return;
  
  const recordCount = selectedPrimaryRows.value.length;
  let successCount = 0;
  
  progressData.value = { current: 0, total: recordCount, operation: `Adding records to ${props.compareEnvironment.toUpperCase()}` };
  showProgressModal.value = true;
  
  try {
    for (let i = 0; i < selectedPrimaryRows.value.length; i++) {
      const rowId = selectedPrimaryRows.value[i];
      progressData.value.current = i + 1;
      
      const record = unifiedRows.value.find(row => 
        row.primary && !row.primary.__isBlank && getPrimaryRowId(row) === rowId
      )?.primary;
      
      if (record) {
        const { createComparisonRecord } = await import('../utils/comparisonClient.js');
        const formData = {};
        props.entityConfig.formFields.forEach(field => {
          if (record[field.name] !== undefined && record[field.name] !== null) {
            formData[field.name] = record[field.name];
          }
        });
        
        formData.CREATED_DATE = new Date().toISOString().split('T')[0];
        formData.CREATED_BY_USER_ID = userProfileId.value || 1;
        
        await createComparisonRecord(props.compareEnvironment, props.selectedEntity, formData);
        successCount++;
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    selectedPrimaryRows.value = [];
    showProgressModal.value = false;
    await handleRecordUpdated();
    successMessage.value = `Successfully added ${successCount} of ${recordCount} records to ${props.compareEnvironment.toUpperCase()}`;
    showSuccessModal.value = true;
  } catch (error) {
    console.error('Bulk add to compare failed:', error);
    showProgressModal.value = false;
    successMessage.value = `Error adding records: ${error.message}`;
    showSuccessModal.value = true;
  }
};

const bulkAddToPrimary = async () => {
  if (selectedCompareRows.value.length === 0) return;
  
  const recordCount = selectedCompareRows.value.length;
  let successCount = 0;
  
  progressData.value = { current: 0, total: recordCount, operation: `Adding records to ${props.primaryEnvironment.toUpperCase()}` };
  showProgressModal.value = true;
  
  try {
    for (let i = 0; i < selectedCompareRows.value.length; i++) {
      const rowId = selectedCompareRows.value[i];
      progressData.value.current = i + 1;
      
      const record = unifiedRows.value.find(row => 
        row.compare && !row.compare.__isBlank && getCompareRowId(row) === rowId
      )?.compare;
      
      if (record) {
        const formData = {};
        props.entityConfig.formFields.forEach(field => {
          if (record[field.name] !== undefined && record[field.name] !== null) {
            formData[field.name] = record[field.name];
          }
        });
        
        // For SERVICE_PARAM, map SERVICE_ID from compare to primary environment
        if (props.selectedEntity === 'SERVICE_PARAM' && formData.SERVICE_ID) {
          const compareService = compareServices.value.find(s => s.SERVICE_ID === formData.SERVICE_ID);
          if (compareService) {
            const primaryService = allPrimaryServices.value.find(s => 
              s['Service Provider'] === compareService['Service Provider'] && s.URI === compareService.URI
            );
            if (primaryService) {
              formData.SERVICE_ID = primaryService.SERVICE_ID;
            }
          }
        }
        
        formData.CREATED_DATE = new Date().toISOString().split('T')[0];
        formData.CREATED_BY_USER_ID = userProfileId.value || 1;
        
        await props.entityConfig.createFunction(formData);
        successCount++;
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    selectedCompareRows.value = [];
    showProgressModal.value = false;
    await handleRecordUpdated();
    successMessage.value = `Successfully added ${successCount} of ${recordCount} records to ${props.primaryEnvironment.toUpperCase()}`;
    showSuccessModal.value = true;
  } catch (error) {
    console.error('Bulk add to primary failed:', error);
    showProgressModal.value = false;
    successMessage.value = `Error adding records: ${error.message}`;
    showSuccessModal.value = true;
  }
};

const filteredDifferences = computed(() => {
  if (props.selectedEntity === 'SERVICE_PARAM' && selectedServiceFilter.value) {
    return unifiedRows.value.filter(row => {
      const primaryId = row.primary && !row.primary.__isBlank ? row.primary[props.entityConfig?.idField || 'id'] : null;
      return primaryId && differences.value.has(primaryId);
    }).length;
  }
  
  if (props.selectedEntity === 'REDIRECT_URL' && selectedProductFilter.value) {
    return unifiedRows.value.filter(row => {
      const primaryId = row.primary && !row.primary.__isBlank ? row.primary[props.entityConfig?.idField || 'id'] : null;
      return primaryId && differences.value.has(primaryId);
    }).length;
  }
  
  return differences.value.size;
});

const foreignKeyOptions = ref(new Map());

const getEditFieldOptions = (fieldName) => {
  if (fieldName === 'SERVICE_ID') {
    const services = editingEntity.value?.environment === 'compare' ? compareServices.value : allPrimaryServices.value;
    if (services && services.length > 0) {
      return services.map(service => ({
        value: service.SERVICE_ID,
        label: `${service.SERVICE_ID}: ${service['Service Provider']} - ${service.URI}`
      }));
    }
  }
  
  if (fieldName === 'ORIGIN_PRODUCT_ID') {
    const products = editingEntity.value?.environment === 'compare' ? compareProducts.value : allPrimaryProducts.value;
    if (products && products.length > 0) {
      return products.map(product => ({
        value: product.ORIGIN_PRODUCT_ID,
        label: `${product.ORIGIN_PRODUCT_ID}: ${product.PRODUCT_ID}`
      }));
    }
  }
  
  if (fieldName === 'STEP_TYPE_ID') {
    const stepTypes = editingEntity.value?.environment === 'compare' ? compareStepTypes.value : allPrimaryStepTypes.value;
    if (stepTypes && stepTypes.length > 0) {
      return stepTypes.map(stepType => ({
        value: stepType.STEP_TYPE_ID,
        label: `${stepType.STEP_TYPE_ID}: ${stepType.STEP_TYPE_NAME}`
      }));
    }
  }
  
  if (fieldName === 'SERVICE_PROVIDER_ID') {
    const providers = editingEntity.value?.environment === 'compare' ? compareServiceProviders.value : allPrimaryServiceProviders.value;
    if (providers && providers.length > 0) {
      return providers.map(provider => ({
        value: provider.SERVICE_PROVIDER_ID,
        label: `${provider.SERVICE_PROVIDER_ID}: ${provider.SERVICE_PROVIDER_NAME}`
      }));
    }
  }
  
  if (fieldName === 'SOURCE_SERVICE_PARAM_ID' || fieldName === 'TARGET_SERVICE_PARAM_ID') {
    const params = editingEntity.value?.environment === 'compare' ? compareServiceParams.value : allPrimaryServiceParams.value;
    if (params && params.length > 0) {
      return params.map(param => ({
        value: param.SERVICE_PARAM_ID,
        label: `${param.SERVICE_PARAM_ID}: ${param.PARAM_NAME}`
      }));
    }
  }
  
  // Check if field has predefined options in entity config
  const formField = props.entityConfig?.formFields?.find(f => f.name === fieldName);
  if (formField?.options) {
    return formField.options;
  }
  
  return [];
};

const loadForeignKeyOptions = async () => {
  // No longer needed - using existing data
  return;
};

const ensureForeignKeyExists = async (fieldName, foreignKeyId, config, targetEnvironment) => {
  try {
    // Determine source environment (opposite of target)
    const sourceEnvironment = targetEnvironment === props.compareEnvironment ? props.primaryEnvironment : props.compareEnvironment;
    const isSourcePrimary = sourceEnvironment === props.primaryEnvironment;
    
    // Find the source record in correct environment data
    let sourceRecord = null;
    let actualForeignKeyId = foreignKeyId;
    
    // If foreignKeyId is in display format "ID: Name", extract the ID
    if (typeof foreignKeyId === 'string' && foreignKeyId.includes(':')) {
      actualForeignKeyId = parseInt(foreignKeyId.split(':')[0].trim());
    }
    
    if (config.entity === 'ORIGIN_PRODUCT') {
      const products = isSourcePrimary ? allPrimaryProducts.value : compareProducts.value;
      sourceRecord = products.find(p => p.ORIGIN_PRODUCT_ID === actualForeignKeyId);
    } else if (config.entity === 'STEP_TYPE') {
      const stepTypes = isSourcePrimary ? allPrimaryStepTypes.value : compareStepTypes.value;
      sourceRecord = stepTypes.find(s => s.STEP_TYPE_ID === actualForeignKeyId);
    } else if (config.entity === 'SERVICE_PROVIDER') {
      const providers = isSourcePrimary ? allPrimaryServiceProviders.value : compareServiceProviders.value;
      sourceRecord = providers.find(p => p.SERVICE_PROVIDER_ID === actualForeignKeyId);
    } else if (config.entity === 'SERVICE_PARAM') {
      const params = isSourcePrimary ? allPrimaryServiceParams.value : compareServiceParams.value;
      sourceRecord = params.find(p => p.SERVICE_PARAM_ID === actualForeignKeyId);
    } else if (config.entity === 'SERVICE') {
      const services = isSourcePrimary ? allPrimaryServices.value : compareServices.value;
      sourceRecord = services.find(s => s.SERVICE_ID === actualForeignKeyId);
    }
    
    if (!sourceRecord) {
      console.warn(`Source record not found for ${config.entity} ID ${actualForeignKeyId}`);
      return;
    }
    
    // Check if record exists in target environment
    const { loadComparisonData } = await import('../utils/comparisonClient.js');
    const originalEnv = window.compareEnvironment;
    window.compareEnvironment = targetEnvironment;
    const targetData = await loadComparisonData(config.entity);
    window.compareEnvironment = originalEnv;
    
    const targetRecords = targetData?.data ? Object.values(targetData.data)[0]?.items || [] : [];
    
    // Check if matching record exists using matchFields
    const existingRecord = targetRecords.find(record => 
      config.matchFields.every(field => record[field] === sourceRecord[field])
    );
    
    if (existingRecord) {
      const idField = config.entity === 'ORIGIN_PRODUCT' ? 'ORIGIN_PRODUCT_ID' : 'STEP_TYPE_ID';
      return existingRecord[idField];
    }
    
    // Create the missing record
    const createData = {};
    config.copyFields.forEach(field => {
      if (sourceRecord[field] !== undefined) {
        createData[field] = sourceRecord[field];
      }
    });
    
    createData.CREATED_DATE = new Date().toISOString().split('T')[0];
    createData.CREATED_BY_USER_ID = userProfileId.value || 1;
    
    const { createComparisonRecord } = await import('../utils/comparisonClient.js');
    const result = await createComparisonRecord(targetEnvironment, config.entity, createData);
    
    // Return the new ID
    let idField;
    if (config.entity === 'ORIGIN_PRODUCT') {
      idField = 'ORIGIN_PRODUCT_ID';
    } else if (config.entity === 'STEP_TYPE') {
      idField = 'STEP_TYPE_ID';
    } else if (config.entity === 'SERVICE_PROVIDER') {
      idField = 'SERVICE_PROVIDER_ID';
    } else if (config.entity === 'SERVICE_PARAM') {
      idField = 'SERVICE_PARAM_ID';
    } else if (config.entity === 'SERVICE') {
      idField = 'SERVICE_ID';
    }
    
    const createKey = Object.keys(result.data)[0];
    const createdRecord = result.data[createKey];
    return createdRecord[idField];
    
  } catch (error) {
    console.error(`Failed to auto-create ${config.entity}:`, error);
    throw new Error(`Failed to create required ${config.entity} record: ${error.message}`);
  }
};
</script>

<style scoped>
.environment-comparison {
  padding: 20px;
  height: 100%;
  width: 100%;
  max-width: 100vw;
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

.unified-table-container {
  height: 100%;
  overflow: auto;
  border: 1px solid var(--border-color, #dee2e6);
  border-radius: 4px;
}

.unified-comparison-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: auto;
}

.environment-header th {
  background-color: var(--table-header-bg, #f8f9fa);
  padding: 10px;
  text-align: center;
  font-weight: bold;
  border: 1px solid var(--border-color, #dee2e6);
}

.primary-env-header {
  background-color: #e3f2fd !important;
  color: #1976d2;
  border-right: 3px solid #1976d2 !important;
}

.compare-env-header {
  background-color: #fff3e0 !important;
  color: #f57c00;
  border-left: 3px solid #f57c00 !important;
}

.actions-header {
  width: 120px;
  background-color: var(--table-header-bg, #f8f9fa) !important;
}

.field-header th {
  background-color: var(--table-header-bg, #f8f9fa);
  padding: 8px;
  border: 1px solid var(--border-color, #dee2e6);
  font-weight: bold;
}

.primary-field {
  border-right: 3px solid #1976d2 !important;
}

.compare-field {
  border-left: 3px solid #f57c00 !important;
}

.unified-comparison-table td {
  padding: 8px;
  border: 1px solid var(--border-color, #dee2e6);
  vertical-align: top;
  word-wrap: break-word;
  overflow-wrap: break-word;
  max-width: 200px;
}

.actions-cell {
  width: 120px;
  white-space: normal;
}

.primary-cell {
  border-right: 3px solid #1976d2 !important;
}

.compare-cell {
  border-left: 3px solid #f57c00 !important;
}

.both-blank {
  background-color: var(--bg-color, #f8f9fa);
}

.primary-missing {
  background-color: rgba(255, 152, 0, 0.1);
}

.compare-missing {
  background-color: rgba(25, 118, 210, 0.1);
}

.field-different {
  background-color: rgba(255, 193, 7, 0.3) !important;
  font-weight: bold;
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

.edit-modal {
  min-width: 500px;
  max-width: 700px;
}

.edit-form {
  margin: 20px 0;
}

.form-input {
  width: 100%;
  padding: 8px;
  border: 1px solid var(--border-color, #dee2e6);
  border-radius: 4px;
  background: var(--input-bg, #fff);
  color: var(--text-color, #333);
}

.form-input:disabled {
  background-color: var(--bg-color, #f8f9fa);
  color: var(--text-muted, #6c757d);
}

.product-filter-section,
.service-filter-section {
  margin-bottom: 20px;
  padding: 15px;
  border: 1px solid var(--border-color, #dee2e6);
  border-radius: 4px;
  background: var(--bg-color, #f8f9fa);
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.filter-group label {
  font-weight: bold;
  white-space: nowrap;
}

.filter-group select {
  padding: 8px;
  min-width: 300px;
  border: 1px solid var(--border-color, #dee2e6);
  border-radius: 4px;
  background: var(--input-bg, #fff);
  color: var(--text-color, #333);
}

.no-common-products,
.no-common-services {
  text-align: center;
  padding: 20px;
  color: var(--text-color, #666);
}

.no-common-products p,
.no-common-services p {
  margin: 10px 0;
}

.no-common-products strong,
.no-common-services strong {
  color: var(--primary-color, #007bff);
}

.no-service-selected {
  text-align: center;
  padding: 40px;
  color: var(--text-color, #666);
  border: 1px dashed var(--border-color, #dee2e6);
  background: var(--bg-color, #f8f9fa);
  border-radius: 4px;
  margin: 20px 0;
}

.no-service-selected p {
  margin: 0;
  font-size: 16px;
}

.bulk-actions-container {
  display: flex;
  gap: 20px;
  margin-bottom: 10px;
}

.bulk-actions {
  flex: 1;
  padding: 10px;
  border: 1px solid var(--border-color, #dee2e6);
  border-radius: 4px;
  display: flex;
  gap: 10px;
  align-items: center;
}

.bulk-actions-primary {
  background: #e3f2fd;
  border-color: #1976d2;
}

.bulk-actions-compare {
  background: #fff3e0;
  border-color: #f57c00;
}

.selection-count {
  margin-left: auto;
  font-weight: bold;
  color: var(--text-color, #666);
}

.checkbox-header {
  width: 50px;
  background-color: var(--table-header-bg, #f8f9fa) !important;
}

.checkbox-cell {
  width: 50px;
  text-align: center;
  padding: 8px;
}

.progress-bar {
  width: 100%;
  height: 20px;
  background-color: #f0f0f0;
  border-radius: 10px;
  overflow: hidden;
  margin: 15px 0;
}

.progress-fill {
  height: 100%;
  background-color: #007bff;
  transition: width 0.3s ease;
}

.progress-text {
  text-align: center;
  font-weight: bold;
  margin: 10px 0;
}

.grey-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(128, 128, 128, 0.5);
  z-index: 999;
  pointer-events: none;
}

.progress-overlay {
  z-index: 1001;
}
</style>