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
                <button v-if="row.primary && !row.primary.__isBlank" @click="editRecord(row.primary, 'primary')" class="btn-primary">Edit</button>
                <button v-if="row.primary && !row.primary.__isBlank && (!row.compare || row.compare.__isBlank)" @click="addToOther(row.primary, compareEnvironment)" class="btn-success">Add to {{ compareEnvironment.toUpperCase() }}</button>
                <button v-if="row.primary && !row.primary.__isBlank && row.compare && !row.compare.__isBlank && hasDifferences(row.primary)" @click="copyToOther(row.primary, compareEnvironment)" class="btn-warning">Copy to {{ compareEnvironment.toUpperCase() }}</button>
              </td>
              <td v-for="field in filteredFields" :key="`primary-${field}`" :class="getCellClass(row, field, 'primary')" class="primary-cell">
                <span v-if="row.primary && !row.primary.__isBlank">{{ formatFieldValue(row.primary[field], field) }}</span>
                <span v-else class="blank-cell">—</span>
              </td>
              <td v-if="selectedEntity === 'SERVICE_PARAM' && selectedServiceFilter" class="checkbox-cell">
                <input v-if="row.compare && !row.compare.__isBlank && (!row.primary || row.primary.__isBlank)" type="checkbox" :value="getCompareRowId(row)" v-model="selectedCompareRows">
              </td>
              <td class="actions-cell">
                <button v-if="row.compare && !row.compare.__isBlank" @click="editRecord(row.compare, 'compare')" class="btn-primary">Edit</button>
                <button v-if="row.compare && !row.compare.__isBlank && (!row.primary || row.primary.__isBlank)" @click="addToOther(row.compare, primaryEnvironment)" class="btn-success">Add to {{ primaryEnvironment.toUpperCase() }}</button>
                <button v-if="row.compare && !row.compare.__isBlank && row.primary && !row.primary.__isBlank && hasDifferences(row.compare)" @click="copyToOther(row.compare, primaryEnvironment)" class="btn-warning">Copy to {{ primaryEnvironment.toUpperCase() }}</button>
              </td>
              <td v-for="field in filteredFields" :key="`compare-${field}`" :class="getCellClass(row, field, 'compare')" class="compare-cell">
                <span v-if="row.compare && !row.compare.__isBlank">{{ formatFieldValue(row.compare[field], field) }}</span>
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
            <input 
              :id="formField.name" 
              v-model="editFormData[formField.name]" 
              :type="formField.type || 'text'"
              :disabled="formField.name.includes('_ID') && formField.name !== 'PSCU_CLIENT_ID'"
              class="form-input"
            />
          </div>
          <div class="form-group">
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
            {{ copyDifferencesData.targetEnvironment === compareEnvironment ? 
                copyDifferencesData.diffInfo.primaryRecord[field] : 
                copyDifferencesData.diffInfo.compareRecord[field] }}
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
const allPrimaryProducts = ref([]);
const compareProducts = ref([]);
const selectedProductFilter = ref('');
const allPrimaryServices = ref([]);
const compareServices = ref([]);
const selectedServiceFilter = ref('');
const selectedRows = ref([]);
const selectedPrimaryRows = ref([]);
const selectedCompareRows = ref([]);

// Watch compareData changes
watch(compareData, (newVal) => {
  console.log('EnvironmentComparison: compareData changed, length =', newVal.length);
  if (newVal.length > 0 && primaryData.value.length > 0) {
    console.log('Both datasets available, analyzing differences');
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
  const primaryKeyFields = ['ORIGIN_PRODUCT_ID', 'SERVICE_ID', 'SERVICE_PROVIDER_ID', 'REDIRECT_URL_ID', 'SERVICE_PARAM_ID'];
  return (props.entityConfig?.fields || []).filter(field => 
    !auditFields.includes(field) && !primaryKeyFields.includes(field)
  );
});

const analyzeDifferences = () => {
  console.log('=== ANALYZE DIFFERENCES START ===');
  console.log('Primary data length:', primaryData.value.length);
  console.log('Compare data length:', compareData.value.length);
  
  // Global fields to exclude from all comparisons
  // const globalExcludeFields = ['_ID', 'CREATED_BY_USER_ID', 'CREATED_DATE', 'CHANGED_BY_USER_ID', 'CHANGED_DATE', 'Service Provider', 'SERVICE_ID', 'SERVICE_PROVIDER_ID', 'ORIGIN_PRODUCT_ID', 'PRODUCT_ID', 'REDIRECT_URL_ID', 'SERVICE_PARAM_ID'];
  const globalExcludeFields = ['CREATED_BY_USER_ID', 'CREATED_DATE', 'CHANGED_BY_USER_ID', 'CHANGED_DATE', 'SERVICE_ID', 'SERVICE_PROVIDER_ID', 'ORIGIN_PRODUCT_ID', 'PRODUCT_ID', 'REDIRECT_URL_ID', 'SERVICE_PARAM_ID'];
  
  // Entity-specific field configurations
  const entityConfigs = {
    SERVICE: {
      matchingFields: ['SERVICE_PROVIDER_NAME', 'URI'], // Fields that must match for pairing
      comparisonFields: ['SERVICE_PROVIDER_NAME', 'URI', 'SECRET_NAME', 'REQUEST_TYPE'] // All fields to compare for differences
    },
    ORIGIN_PRODUCT: {
      matchingFields: ['PRODUCT_ID', 'URL_TYPE_CODE'], // Fields that must match for pairing
      comparisonFields: null // Use all available fields
    },
    REDIRECT_URL: {
      matchingFields: ['PRODUCT_ID'],
      comparisonFields: null // Use all available fields
    },
    SERVICE_PROVIDER: {
      matchingFields: ['SERVICE_PROVIDER_NAME'],
      comparisonFields: null // Use all available fields
    },
    SERVICE_PARAM: {
      matchingFields: ['PARAM_NAME'],
      comparisonFields: null, // Use all available fields
      stringMatchFields: ['PARAM_NAME'],
      stringMatchThreshold: 0.75
    },
    SERVICE_PARAM_MAPPING: {
      matchingFields: ['Target Service', 'Source Service', 'Target Param Name', 'Target Expr', 'Source Param Name', 'Source Expr'],
      comparisonFields: null // Use all available fields
    },
    STEP_SERVICE_MAPPING: {
      matchingFields: ['STEP_TYPE', 'SERVICE'],
      comparisonFields: null // Use all available fields
    },
    STEP_TYPE: {
      matchingFields: ['STEP_TYPE_NAME', 'STEP_TYPE_DESC', 'RESOURCE_NAME'],
      comparisonFields: null // Use all available fields
    }
  };
  
  const diffs = new Map();
  const fieldDiffs = new Map();
  
  // String similarity function using substring matching
  const calculateStringSimilarity = (str1, str2) => {
    if (!str1 || !str2) return 0;
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();
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
    const config = entityConfigs[props.selectedEntity] || {};
    
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
        
        console.log(`${config.matchingFields.join(' + ')} match found (${Math.round(highestSimilarity * 100)}%) - checking field differences`);
      } else {
        // Check if all matching fields are identical
        const matchingFieldsMatch = config.matchingFields.every(field => record1[field] === record2[field]);
        
        if (!matchingFieldsMatch) {
          return { matchPercentage: 0, differentFields: comparisonFields, totalFields: comparisonFields.length };
        }
        
        console.log(`${config.matchingFields.join(' + ')} exact match found - checking field differences`);
      }
    } else {
      // Default PRODUCT_ID matching for entities without specific matching fields
      if (record1.PRODUCT_ID !== record2.PRODUCT_ID) {
        return { matchPercentage: 0, differentFields: comparisonFields, totalFields: comparisonFields.length };
      }
      console.log('PRODUCT_ID exact match found - checking field differences');
    }
    
    // Compare all fields to find differences
    let matches = 0;
    const differentFields = [];
    
    comparisonFields.forEach(field => {
      const val1 = record1[field];
      const val2 = record2[field];
      console.log(`  ${field}: '${val1}' vs '${val2}' - ${val1 === val2 ? 'MATCH' : 'DIFFERENT'}`);
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
      
      if (match.matchPercentage >= 75) {
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
  
  console.log(`Found ${allPossibleMatches.length} potential matches above 80% threshold`);
  
  // Sort by match percentage - 100% matches first, then by highest percentage
  allPossibleMatches.sort((a, b) => {
    if (a.matchPercentage === 100 && b.matchPercentage !== 100) return -1;
    if (b.matchPercentage === 100 && a.matchPercentage !== 100) return 1;
    return b.matchPercentage - a.matchPercentage;
  });
  
  console.log('Top 5 potential matches:', allPossibleMatches.slice(0, 5).map(m => 
    `${m.primaryId}->${m.compareId} (${m.matchPercentage}%)`
  ));
  
  // Separate perfect matches (100%) from partial matches
  const perfectMatches = allPossibleMatches.filter(m => m.matchPercentage === 100);
  const partialMatches = allPossibleMatches.filter(m => m.matchPercentage < 100);
  
  console.log(`Perfect matches (100%): ${perfectMatches.length}`);
  console.log(`Partial matches: ${partialMatches.length}`);
  
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
      console.log(`✅ PERFECT MATCH: Record ${match.primaryId} matches Record ${match.compareId} (identical)`);
    }
  }
  
  // Then process remaining perfect matches (100% but with differences)
  for (const match of perfectMatches.filter(m => m.differentFields.length > 0)) {
    if (!usedPrimaryIds.has(match.primaryId) && !usedCompareIds.has(match.compareId)) {
      selectedMatches.push(match);
      usedPrimaryIds.add(match.primaryId);
      usedCompareIds.add(match.compareId);
      console.log(`✅ SELECTED: Record ${match.primaryId} matches Record ${match.compareId} at 100%`);
    }
  }
  
  // Finally, process partial matches
  for (const match of partialMatches) {
    if (!usedPrimaryIds.has(match.primaryId) && !usedCompareIds.has(match.compareId)) {
      selectedMatches.push(match);
      usedPrimaryIds.add(match.primaryId);
      usedCompareIds.add(match.compareId);
      console.log(`✅ SELECTED: Record ${match.primaryId} matches Record ${match.compareId} at ${match.matchPercentage}%`);
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
      console.log(`  Different fields:`);
      match.differentFields.forEach(field => {
        console.log(`    ${field}: ${props.primaryEnvironment}='${match.primaryRecord[field]}' vs ${props.compareEnvironment}='${match.compareRecord[field]}'`);
      });
    } else {
      console.log(`  No differences found`);
    }
  });
  
  // Log unmatched records
  primaryData.value.forEach(primaryRecord => {
    const primaryId = primaryRecord[props.entityConfig?.idField || 'id'];
    if (!usedPrimaryIds.has(primaryId)) {
      diffs.set(primaryId, ['NO_MATCH_FOUND']);
      // console.log(`❌ Record ${primaryId}: No match found in ${props.compareEnvironment}`);
    }
  });
  
  // console.log('Used primary IDs:', Array.from(usedPrimaryIds));
  // console.log('Used compare IDs:', Array.from(usedCompareIds));
  
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
      // console.log(`Added to matched pairs: primary ${primaryId}`);
    } else {
      unmatched1.push(primaryRecord);
      // console.log(`Added to unmatched primary: ${primaryId}`);
    }
  });
  
  // Find unmatched compare records
  const matchedCompareIds = new Set(Array.from(fieldDiffs.values()).map(diff => diff.compareId));
  
  compareData.value.forEach(compareRecord => {
    const compareId = compareRecord[props.entityConfig?.idField || 'id'];
    if (!matchedCompareIds.has(compareId)) {
      unmatched2.push(compareRecord);
      console.log(`Added to unmatched compare: ${compareId}`);
    }
  });
  
  matchedPairs.value = pairs;
  unmatchedPrimary.value = unmatched1;
  unmatchedCompare.value = unmatched2;
  differences.value = diffs;
  fieldDifferences.value = fieldDiffs;
  
  console.log('Updated reactive data:');
  console.log('- matchedPairs.value length:', matchedPairs.value.length);
  console.log('- unmatchedPrimary.value length:', unmatchedPrimary.value.length);
  console.log('- unmatchedCompare.value length:', unmatchedCompare.value.length);
  
  console.log('\n=== ANALYZE DIFFERENCES RESULTS ===');
  console.log('Matched pairs:', pairs.length);
  console.log('Unmatched primary:', unmatched1.length);
  console.log('Unmatched compare:', unmatched2.length);
  console.log('Total differences:', differences.value.size);
  console.log('Matched pairs details:', pairs.map(p => ({
    primaryId: p.primary[props.entityConfig?.idField || 'id'],
    compareId: p.compare[props.entityConfig?.idField || 'id'],
    primaryVendor: p.primary.VENDOR_NAME,
    compareVendor: p.compare.VENDOR_NAME
  })));
  console.log('=== ANALYZE DIFFERENCES END ===\n');
};

const loadCommonProducts = async () => {
  if (props.selectedEntity !== 'REDIRECT_URL') return;
  
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
    
    console.log('Primary products loaded:', allPrimaryProducts.value.length);
    console.log('Compare products loaded:', compareProducts.value.length);
  } catch (error) {
    console.error('Error loading products:', error);
    allPrimaryProducts.value = [];
    compareProducts.value = [];
  }
};

const loadCommonServices = async () => {
  if (props.selectedEntity !== 'SERVICE_PARAM') return;
  
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
    
    console.log('Primary services loaded:', allPrimaryServices.value.length);
    console.log('Compare services loaded:', compareServices.value.length);
  } catch (error) {
    console.error('Error loading services:', error);
    allPrimaryServices.value = [];
    compareServices.value = [];
  }
};

const productExistsInCompare = (productId) => {
  return compareProducts.value.some(product => product.PRODUCT_ID === productId);
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
  console.log('=== PRIMARY DATA WATCH TRIGGERED ===');
  if (props.entityConfig?.loadFunction) {
    try {
      console.log('Loading primary data...');
      const result = await props.entityConfig.loadFunction();
      console.log('Primary load result:', result);
      if (result?.data) {
        const dataKey = Object.keys(result.data)[0];
        const items = result.data[dataKey]?.items || [];
        console.log('Primary data loaded:', items.length, 'items');
        primaryData.value = items;
        console.log('Both primary and compare data available, analyzing differences');
        analyzeDifferences();
      }
    } catch (error) {
      console.error('Error loading primary data for comparison:', error);
    }
  }
}, { immediate: true });

// Watch for compare environment changes to load compare data
watch(() => props.compareEnvironment, async () => {
  if (props.compareEnvironment) {
    console.log('=== COMPARE ENVIRONMENT CHANGED ===');
    console.log('Loading compare data for', props.selectedEntity, 'from', props.compareEnvironment);
    
    try {
      const { loadComparisonData } = await import('../utils/comparisonClient.js');
      window.compareEnvironment = props.compareEnvironment;
      localStorage.setItem('compareEnvironment', props.compareEnvironment);
      
      const result = await loadComparisonData(props.selectedEntity);
      
      if (result?.data) {
        const dataKey = Object.keys(result.data)[0];
        const items = result.data[dataKey]?.items || [];
        console.log('Compare data loaded:', items.length, 'items');
        compareData.value = items;
        
        console.log('Both primary and compare data available, analyzing differences');
        analyzeDifferences();
      }
    } catch (error) {
      console.error('Error loading compare data:', error);
      compareData.value = [];
    }
  } else {
    compareData.value = [];
  }
}, { immediate: true });

// Watch for entity or environment changes to load products and services
watch([() => props.selectedEntity, () => props.compareEnvironment], async () => {
  if (props.selectedEntity === 'REDIRECT_URL' && props.compareEnvironment) {
    await loadCommonProducts();
  }
  if (props.selectedEntity === 'SERVICE_PARAM' && props.compareEnvironment) {
    await loadCommonServices();
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

const formatFieldValue = (value, field) => {
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
  
  if (record[field] !== otherRecord[field]) {
    return 'field-different';
  }
  
  return '';
};

const editRecord = (record, environment) => {
  // Trigger the actual edit modal by emitting to parent or using existing edit logic
  handleEditRecord({ entity: record, environment, entityType: props.selectedEntity });
};

const handleEditRecord = (data) => {
  console.log('Edit record:', data);
  editingEntity.value = { ...data.entity, environment: data.environment };
  
  // Create clean form data, excluding computed fields and ensuring proper JSON structure
  editFormData.value = {};
  Object.keys(data.entity).forEach(key => {
    if (!['Service Provider'].includes(key)) {
      const value = data.entity[key];
      // Ensure we have clean, serializable values
      editFormData.value[key] = value === null || value === undefined ? '' : String(value);
    }
  });
  
  // Set CHANGED_BY_USER_ID with proper default
  editFormData.value.CHANGED_BY_USER_ID = userProfileId.value || 1;
  
  showEditModal.value = true;
};

const closeEditModal = () => {
  showEditModal.value = false;
  editingEntity.value = null;
  editFormData.value = {};
};

const saveEditRecord = async () => {
  try {
    // Create clean update data with proper JSON serialization
    const cleanData = {};
    Object.keys(editFormData.value).forEach(key => {
      const value = editFormData.value[key];
      if (value !== null && value !== undefined && value !== '') {
        // Skip primary key fields that shouldn't be updated
        if (key === 'ORIGIN_PRODUCT_ID' || key === '_ID') {
          return;
        }
        // Convert to proper types based on field name
        if (key.includes('_ID') && !isNaN(value)) {
          cleanData[key] = parseInt(value);
        } else {
          cleanData[key] = String(value).trim();
        }
      }
    });
    
    // Add the primary key for identification - use the correct ID for the environment being edited
    if (props.selectedEntity === 'REDIRECT_URL' && editingEntity.value.REDIRECT_URL_ID) {
      cleanData.REDIRECT_URL_ID = parseInt(editingEntity.value.REDIRECT_URL_ID);
    } else if (editingEntity.value.ORIGIN_PRODUCT_ID) {
      cleanData.ORIGIN_PRODUCT_ID = parseInt(editingEntity.value.ORIGIN_PRODUCT_ID);
    }
    
    // Remove fields not part of update schemas
    if (props.selectedEntity === 'REDIRECT_URL') {
      delete cleanData.PRODUCT_ID;
      delete cleanData.CREATED_BY_USER_ID;
      delete cleanData.CREATED_DATE;
      // Ensure ORIGIN_PRODUCT_ID is included for REDIRECT_URL
      if (editingEntity.value.ORIGIN_PRODUCT_ID) {
        cleanData.ORIGIN_PRODUCT_ID = parseInt(editingEntity.value.ORIGIN_PRODUCT_ID);
      }
    }
    
    // Remove CREATED fields for SERVICE_PROVIDER and SERVICE updates
    if (props.selectedEntity === 'SERVICE_PROVIDER' || props.selectedEntity === 'SERVICE') {
      delete cleanData.CREATED_BY_USER_ID;
      delete cleanData.CREATED_DATE;
    }
    
    // Add audit fields for update
    cleanData.CHANGED_DATE = new Date().toISOString().split('T')[0];
    if (cleanData.CHANGED_BY_USER_ID) {
      cleanData.CHANGED_BY_USER_ID = parseInt(cleanData.CHANGED_BY_USER_ID);
    }
    
    console.log('Clean data being sent:', JSON.stringify(cleanData, null, 2));
    
    let result;
    
    // Determine which environment we're editing based on the edit button clicked
    const isCompareEnvironment = editingEntity.value.environment === 'compare';
    
    if (isCompareEnvironment) {
      // Use comparison client for compare environment
      const { updateComparisonRecord } = await import('../utils/comparisonClient.js');
      result = await updateComparisonRecord(props.compareEnvironment, props.selectedEntity, cleanData);
    } else {
      // Use regular update function for primary environment
      result = await props.entityConfig.updateFunction(cleanData);
    }
    
    console.log('Edit result:', result);
    
    if (result && !result.errors) {
      closeEditModal();
      
      // Immediately refresh data
      await handleRecordUpdated();
      
      // Show success modal after refresh
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
  
  // First check if this is a primary record with differences
  const diffInfo = fieldDifferences.value.get(recordId);
  if (diffInfo && diffInfo.differentFields.length > 0) {
    return true;
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
      console.log('No differences to copy');
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
    
    // Override with the different field values from the source record
    diffInfo.differentFields.forEach(field => {
      updateData[field] = sourceRecord[field];
    });
    
    // Remove CREATED fields from updates
    delete updateData.CREATED_BY_USER_ID;
    delete updateData.CREATED_DATE;
    
    // Remove PRODUCT_ID for REDIRECT_URL updates (not accepted by schema)
    if (props.selectedEntity === 'REDIRECT_URL') {
      delete updateData.PRODUCT_ID;
    }
    
    // Add audit fields
    updateData.CHANGED_DATE = new Date().toISOString().split('T')[0];
    updateData.CHANGED_BY_USER_ID = userProfileId.value || 1;
    
    console.log('Updating record with differences:', updateData);
    
    // Use comparison client to update the record in target environment
    const { updateComparisonRecord } = await import('../utils/comparisonClient.js');
    await updateComparisonRecord(props.selectedEntity, targetEnvironment, updateData);
    
    console.log(`Successfully copied differences to ${targetEnvironment}`);
    
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
        const sourceProviderName = sourceProvider?.['Service Provider']?.split(': ')[1];
        
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
    
    // Add current date and user ID for audit fields
    const currentDate = new Date().toISOString().split('T')[0];
    formData.CREATED_DATE = currentDate;
    formData.CREATED_BY_USER_ID = userProfileId.value || 1;
    
    console.log('Adding record to target environment:', targetEnvironment);
    console.log('Form data being sent:', formData);
    
    // Use createComparisonRecord which handles SERVICE_ID mapping
    console.log('Creating record in target environment:', targetEnvironment);
    
    const { createComparisonRecord } = await import('../utils/comparisonClient.js');
    const result = await createComparisonRecord(targetEnvironment, props.selectedEntity, formData);
    
    console.log('Create result:', result);
    console.log('Create result data:', JSON.stringify(result.data, null, 2));
    console.log('Create result errors:', result.errors);
    
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
    console.log('Created record:', createdRecord);
    
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
    
    console.log(`Successfully added record to ${targetEnvironment}`);
    
    // Immediately refresh data
    console.log('Reloading data after create operation...');
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
    
    console.log('Full error object:', JSON.stringify(error, null, 2));
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

const handleRecordUpdated = async () => {
  console.log('Record updated, reloading data and re-analyzing differences');
  
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

onMounted(async () => {
  await loadUserProfile();
  if (props.selectedEntity === 'REDIRECT_URL' && props.compareEnvironment) {
    await loadCommonProducts();
  }
  if (props.selectedEntity === 'SERVICE_PARAM' && props.compareEnvironment) {
    await loadCommonServices();
  }
  console.log('Environment comparison mounted', {
    primary: props.primaryEnvironment,
    entity: props.selectedEntity,
    compareDataLength: compareData.value.length
  });
});

// Debug computed to check compareData reactivity
const debugCompareLength = computed(() => {
  console.log('EnvironmentComparison: computed compareData.length =', compareData.value.length);
  return compareData.value.length;
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
  table-layout: fixed;
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