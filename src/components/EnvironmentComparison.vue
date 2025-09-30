<template>
  <div class="environment-comparison">
    <div class="comparison-header">
      <h2>Environment Comparison: {{ primaryEnvironment.toUpperCase() }} vs {{ compareEnvironment.toUpperCase() }}</h2>
      <div v-if="differences.size > 0" class="differences-summary">
        <span class="diff-count">{{ differences.size }} records with differences</span>
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
      <div class="environment-columns">
        <div class="environment-column">
          <h3>{{ primaryEnvironment.toUpperCase() }} (Primary)</h3>
          <div class="entity-container" ref="primaryContainer">
            <EntityManager
              @scroll="(e) => syncScroll('primary', e)"
              v-if="selectedEntity"
              ref="primaryEntityManager"
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
              :hideFilters="true"
              :fieldDifferences="fieldDifferences"
              :comparisonMode="'primary'"
              :matchedPairs="matchedPairs"
              :unmatchedRecords="unmatchedPrimary"
              :otherEnvironment="compareEnvironment"
              :canAddToOther="canAddToEnvironment('primary')"
              :compareDataLength="debugCompareLength"
              :productFilter="selectedProductFilter"
              :debugInfo="{ primaryDataLength: primaryData.length, matchedPairsLength: matchedPairs.length, unmatchedPrimaryLength: unmatchedPrimary.length }"

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
          <div class="entity-container" ref="compareContainer">
            <EntityManager
              @scroll="(e) => syncScroll('compare', e)"
              v-if="selectedEntity"
              ref="compareEntityManager"
              :key="`compare-${compareEnvironment}-${selectedEntity}`"
              :entityName="selectedEntity"
              :fields="filteredFields"
              :formFields="entityConfig?.formFields || []"
              :idField="entityConfig?.idField || 'id'"
              :loadFunction="getCompareLoadFunction"
              :createFunction="entityConfig?.createFunction"
              :updateFunction="getCompareUpdateFunction"
              :deleteFunction="entityConfig?.deleteFunction"
              :readonly="!canEditEnvironment(compareEnvironment)"
              :hideActionButtons="true"
              :hideRowActions="true"
              :hideFilters="true"
              :fieldDifferences="fieldDifferences"
              :comparisonMode="'compare'"
              :matchedPairs="matchedPairs"
              :unmatchedRecords="unmatchedCompare"
              :primaryData="primaryData"
              :syncFilters="syncFilters"
              :syncSort="syncSort"
              :productFilter="selectedProductFilter"
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
const allPrimaryProducts = ref([]);
const compareProducts = ref([]);
const selectedProductFilter = ref('');

// Watch compareData changes
watch(compareData, (newVal) => {
  console.log('EnvironmentComparison: compareData changed, length =', newVal.length);
  console.log('EnvironmentComparison: About to pass compareDataLength =', newVal.length);
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
  return (props.entityConfig?.fields || []).filter(field => 
    !auditFields.includes(field)
  );
});

const analyzeDifferences = () => {
  console.log('=== ANALYZE DIFFERENCES START ===');
  console.log('Primary data length:', primaryData.value.length);
  console.log('Compare data length:', compareData.value.length);
  
  const ignoreFields = ['_ID', 'CREATED_BY_USER_ID', 'CREATED_DATE', 'CHANGED_BY_USER_ID', 'CHANGED_DATE', 'Service Provider'];
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
    console.log(`Processing primary record ${primaryId}`);
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
      console.log(`Added to matched pairs: primary ${primaryId}`);
    } else {
      unmatched1.push(primaryRecord);
      console.log(`Added to unmatched primary: ${primaryId}`);
    }
  });
  
  // Find unmatched compare records
  compareData.value.forEach(compareRecord => {
    const compareId = compareRecord[props.entityConfig?.idField || 'id'];
    if (!usedCompareIds.has(compareId)) {
      unmatched2.push(compareRecord);
      console.log(`Added to unmatched compare: ${compareId}`);
    }
  });
  
  matchedPairs.value = pairs;
  unmatchedPrimary.value = unmatched1;
  unmatchedCompare.value = unmatched2;
  differences.value = diffs;
  fieldDifferences.value = fieldDiffs;
  
  console.log('=== ANALYZE DIFFERENCES RESULTS ===');
  console.log('Matched pairs:', pairs.length);
  console.log('Unmatched primary:', unmatched1.length);
  console.log('Unmatched compare:', unmatched2.length);
  console.log('Total differences:', differences.value.size);
  console.log('=== ANALYZE DIFFERENCES END ===');
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

const productExistsInCompare = (productId) => {
  return compareProducts.value.some(product => product.PRODUCT_ID === productId);
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
        if (compareData.value.length > 0) {
          console.log('Both primary and compare data available, analyzing differences');
          analyzeDifferences();
        } else {
          console.log('Compare data not yet available, skipping analysis');
        }
      }
    } catch (error) {
      console.error('Error loading primary data for comparison:', error);
    }
  }
}, { immediate: true });

// Watch for entity or environment changes to load products
watch([() => props.selectedEntity, () => props.compareEnvironment], async () => {
  if (props.selectedEntity === 'REDIRECT_URL' && props.compareEnvironment) {
    await loadCommonProducts();
  }
}, { immediate: true });

const syncFilters = ref({});
const syncSort = ref({ field: '', direction: 'asc' });
const primaryContainer = ref(null);
const compareContainer = ref(null);
const primaryEntityManager = ref(null);
const compareEntityManager = ref(null);
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
  
  console.log('Scroll event from:', source, 'scrollTop:', event.target.scrollTop);
  
  isScrolling.value = true;
  const sourceContainer = event.target;
  const targetContainer = source === 'primary' ? compareContainer.value : primaryContainer.value;
  
  console.log('Target container exists:', !!targetContainer);
  
  if (targetContainer && sourceContainer) {
    targetContainer.scrollTop = sourceContainer.scrollTop;
    targetContainer.scrollLeft = sourceContainer.scrollLeft;
    console.log('Synced scroll to:', sourceContainer.scrollTop);
  }
  
  setTimeout(() => {
    isScrolling.value = false;
  }, 50);
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
    
    // Don't remove PRODUCT_ID for ORIGIN_PRODUCT as it's required
    if (props.selectedEntity !== 'ORIGIN_PRODUCT' && updateData.PRODUCT_ID) {
      delete updateData.PRODUCT_ID;
    }
    // Remove CREATED fields from updates
    delete updateData.CREATED_BY_USER_ID;
    delete updateData.CREATED_DATE;
    
    // Add audit fields
    updateData.CHANGED_DATE = new Date().toISOString().split('T')[0];
    updateData.CHANGED_BY_USER_ID = userProfileId.value || 1;
    
    console.log('Updating record with differences:', updateData);
    
    // Use comparison client to update the record in target environment
    const { updateComparisonRecord } = await import('../utils/comparisonClient.js');
    await updateComparisonRecord(targetEnvironment, props.selectedEntity, updateData);
    
    console.log(`Successfully copied differences to ${targetEnvironment}`);
    
    // Force reload of comparison data
    setTimeout(async () => {
      await handleRecordUpdated();
    }, 1000);
    
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
    
    // Use direct API call to target environment
    console.log('Creating record in target environment:', targetEnvironment);
    
    const { callExternalApi } = await import('../client.js');
    
    // Use the same approach as the comparison data loading
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
    
    // Check for negative ID which indicates failure (except -1 which is our Aurora VTL placeholder)
    const idField = props.entityConfig?.idField || 'SERVICE_ID';
    if (createdRecord[idField] && createdRecord[idField] < 0 && createdRecord[idField] !== -1) {
      let errorMsg = `Create operation failed - received invalid ID: ${createdRecord[idField]}`;
      if (props.selectedEntity === 'SERVICE') {
        errorMsg += '. This usually means the SERVICE_PROVIDER_ID does not exist in the target environment.';
      }
      throw new Error(errorMsg);
    }
    
    closeAddToOtherModal();
    
    // Show success message
    const recordName = formData.SERVICE_PROVIDER_NAME || formData.SERVICE_NAME || 'record';
    alert(`Successfully added "${recordName}" to ${targetEnvironment.toUpperCase()}!`);
    
    console.log(`Successfully added record to ${targetEnvironment}`);
    
    // Force reload of comparison data with longer delay to account for database propagation
    setTimeout(async () => {
      console.log('Reloading data after create operation...');
      await handleRecordUpdated();
      // Force EntityManagers to reload based on target environment
      if (targetEnvironment === props.compareEnvironment && compareEntityManager.value) {
        console.log('Reloading compare EntityManager...');
        await compareEntityManager.value.loadEntities();
      } else if (targetEnvironment === props.primaryEnvironment && primaryEntityManager.value) {
        console.log('Reloading primary EntityManager...');
        await primaryEntityManager.value.loadEntities();
      }
    }, 2000);
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

const handleRecordUpdated = async () => {
  console.log('Record updated, reloading data and re-analyzing differences');
  
  // Store current scroll positions
  const primaryScrollTop = primaryContainer.value?.scrollTop || 0;
  const primaryScrollLeft = primaryContainer.value?.scrollLeft || 0;
  const compareScrollTop = compareContainer.value?.scrollTop || 0;
  const compareScrollLeft = compareContainer.value?.scrollLeft || 0;
  
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
  
  // Restore scroll positions after a short delay to allow DOM updates
  setTimeout(() => {
    if (primaryContainer.value) {
      primaryContainer.value.scrollTop = primaryScrollTop;
      primaryContainer.value.scrollLeft = primaryScrollLeft;
    }
    if (compareContainer.value) {
      compareContainer.value.scrollTop = compareScrollTop;
      compareContainer.value.scrollLeft = compareScrollLeft;
    }
  }, 100);
}

onMounted(async () => {
  await loadUserProfile();
  if (props.selectedEntity === 'REDIRECT_URL' && props.compareEnvironment) {
    await loadCommonProducts();
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

.product-filter-section {
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

.no-common-products {
  text-align: center;
  padding: 20px;
  color: var(--text-color, #666);
}

.no-common-products p {
  margin: 10px 0;
}

.no-common-products strong {
  color: var(--primary-color, #007bff);
}
</style>