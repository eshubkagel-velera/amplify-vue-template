<template>
  <div class="mapping-manager">
    <div class="header-row">
      <h2>Service Mapping Manager</h2>
      <ThemeToggle />
    </div>
    
    <!-- Product Information Box -->
    <div class="bordered-section">
      <div v-if="!props.productId">
        <label for="productFilter">Select Product:</label>
        <select id="productFilter" v-model="selectedProductId" @change="onProductChange">
          <option value="">-- Select a Product --</option>
          <option v-for="product in products" :key="product.ORIGIN_PRODUCT_ID" :value="product.ORIGIN_PRODUCT_ID">
            {{ product.ORIGIN_PRODUCT_ID }}: {{ product.VENDOR_NAME }} - {{ product.PRODUCT_DESC }}
          </option>
        </select>
      </div>
      
      <div v-if="selectedProduct" class="product-info">
        <h3>Product Information</h3>
        <p><strong>Product ID:</strong> {{ selectedProduct.PRODUCT_ID }}</p>
        <p><strong>PSCU Client ID:</strong> {{ selectedProduct.PSCU_CLIENT_ID }}</p>
        <p><strong>Partner Code:</strong> {{ selectedProduct.PARTNER_CODE }}</p>
        <p><strong>Description:</strong> {{ selectedProduct.PRODUCT_DESC }}</p>
        <p><strong>Total Mappings:</strong> {{ totalMappingCount }}</p>
      </div>
    </div>
    
    <!-- Filter Dropdowns Box -->
    <div v-if="selectedProductId || props.productId" class="bordered-section">
      <div class="form-controls">
        <div class="form-group">
          <label>Resource Name:</label>
          <select v-model="selectedResourceName" @change="onResourceNameChange">
            <option value="">-- Select Resource --</option>
            <option v-for="resource in resourceNames" :key="resource" :value="resource">
              {{ resource }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>Step Type:</label>
          <select v-model="selectedStepType" @change="onStepTypeChange" :disabled="!selectedResourceName">
            <option value="">-- Select Step Type --</option>
            <option v-for="step in filteredStepTypes" :key="step.STEP_TYPE_ID" :value="step">
              {{ step.STEP_TYPE_ID }}: {{ step.STEP_TYPE_NAME }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>Target Service:</label>
          <select v-model="selectedTargetService" @change="onTargetServiceChange" :disabled="!selectedStepType">
            <option value="">-- Select Target Service --</option>
            <option v-for="service in targetServices" :key="service.SERVICE_ID" :value="service">
              {{ service.SERVICE_ID }}: {{ service.URI }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>Source Service:</label>
          <select v-model="selectedSourceService" @change="onSourceServiceChange" :disabled="!selectedStepType">
            <option value="">-- Select Source Service --</option>
            <option v-for="service in allServices" :key="service.SERVICE_ID" :value="service">
              {{ service.SERVICE_ID }}: {{ service.URI }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <!-- Action Buttons and Target Parameters Row -->
    <div v-if="showActionButtons || selectedTargetService" class="buttons-params-row">
      <!-- Action Buttons -->
      <div v-if="showActionButtons" class="action-buttons">
        <button v-if="!mappingExists" @click="createMapping" :disabled="saving" class="btn-success">
          {{ saving ? 'Saving...' : 'Save Mapping' }}
        </button>
        <button v-if="mappingExists" @click="updateMapping" :disabled="saving" class="btn-primary">
          {{ saving ? 'Updating...' : 'Update Mapping' }}
        </button>
        <button v-if="mappingExists" @click="confirmDeleteMapping" class="btn-danger">
          Delete Mapping
        </button>
        <button @click="addCustomMapping" class="btn-success">Add Custom Mapping</button>
      </div>

      <!-- Target Parameters Available -->
      <div v-if="selectedTargetService" class="target-params-info">
        <h3>Target Parameters Available: {{ mappings.length }}</h3>
      </div>
    </div>

    <!-- Mapping Table -->
    <div v-if="showMappingTable" class="mapping-table-section">
      <div class="table-container">
        <table class="mapping-table">
          <thead>
            <tr>
              <th class="w-12">
                <input type="checkbox" @change="toggleSelectAll" :checked="allSelected" />
              </th>
              <th class="resizable sortable" data-field="TARGET_PARAM_NAME" @click="sortBy('TARGET_PARAM_NAME')">
                Target Param Name
                <span v-if="sortField === 'TARGET_PARAM_NAME'" class="sort-indicator">
                  {{ sortDirection === 'asc' ? '↑' : '↓' }}
                </span>
                <div class="resize-handle" @mousedown="startResize($event, 'TARGET_PARAM_NAME')"></div>
              </th>
              <th class="resizable" data-field="TARGET_EXPR">
                Target Expr
                <div class="resize-handle" @mousedown="startResize($event, 'TARGET_EXPR')"></div>
              </th>
              <th class="resizable" data-field="SOURCE_PARAM_NAME">
                Source Param Name
                <div class="resize-handle" @mousedown="startResize($event, 'SOURCE_PARAM_NAME')"></div>
              </th>
              <th class="resizable" data-field="SOURCE_EXPR">
                Source Expr
                <div class="resize-handle" @mousedown="startResize($event, 'SOURCE_EXPR')"></div>
              </th>
              <th class="resizable nbr-column" data-field="SYSTEM_NBR">
                System NBR
                <div class="resize-handle" @mousedown="startResize($event, 'SYSTEM_NBR')"></div>
              </th>
              <th class="resizable nbr-column" data-field="PRIN_NBR">
                Prin NBR
                <div class="resize-handle" @mousedown="startResize($event, 'PRIN_NBR')"></div>
              </th>
              <th class="resizable nbr-column" data-field="AGENT_NBR">
                Agent NBR
                <div class="resize-handle" @mousedown="startResize($event, 'AGENT_NBR')"></div>
              </th>
              <th>Actions</th>
            </tr>
            <tr class="filter-row">
              <th></th>
              <th>
                <input v-model="filters.TARGET_PARAM_NAME" @input="applyFilters" placeholder="Filter target param" class="filter-input" />
              </th>
              <th>
                <input v-model="filters.TARGET_EXPR" @input="applyFilters" placeholder="Filter target expr" class="filter-input" />
              </th>
              <th>
                <input v-model="filters.SOURCE_PARAM_NAME" @input="applyFilters" placeholder="Filter source param" class="filter-input" />
              </th>
              <th>
                <input v-model="filters.SOURCE_EXPR" @input="applyFilters" placeholder="Filter source expr" class="filter-input" />
              </th>
              <th>
                <input v-model="filters.SYSTEM_NBR" @input="applyFilters" placeholder="Filter system" class="filter-input" />
              </th>
              <th>
                <input v-model="filters.PRIN_NBR" @input="applyFilters" placeholder="Filter prin" class="filter-input" />
              </th>
              <th>
                <input v-model="filters.AGENT_NBR" @input="applyFilters" placeholder="Filter agent" class="filter-input" />
              </th>
              <th>
                <button @click="clearFilters" class="clear-filters-btn">Clear</button>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(mapping, index) in filteredMappings" :key="index">
              <td class="text-center">
                <input type="checkbox" v-model="mapping.selected" />
              </td>
              <td>
                <input v-if="mapping.isCustom" v-model="mapping.TARGET_PARAM_NAME" class="full-width-input" placeholder="Enter parameter name">
                <span v-else class="read-only-text">{{ mapping.TARGET_PARAM_NAME }}</span>
              </td>
              <td>
                <input v-model="mapping.TARGET_EXPR" list="target-expr-options" class="full-width-input" placeholder="Enter or select">
                <datalist id="target-expr-options">
                  <option value="PASSTHRU">PASSTHRU</option>
                  <option value="TRUE">TRUE</option>
                  <option value="FALSE">FALSE</option>
                </datalist>
              </td>
              <td>
                <input v-model="mapping.SOURCE_PARAM_NAME" list="source-param-options" class="full-width-input" placeholder="Enter or select source param">
                <datalist id="source-param-options">
                  <option v-for="param in sourceParams" :key="param.SERVICE_PARAM_ID" :value="param.PARAM_NAME">
                    {{ param.SERVICE_PARAM_ID }}: {{ param.PARAM_NAME }}
                  </option>
                </datalist>
              </td>
              <td>
                <input v-model="mapping.SOURCE_EXPR" list="source-expr-options" class="full-width-input" placeholder="Enter or select">
                <datalist id="source-expr-options">
                  <option value="ALL">ALL</option>
                  <option value="NOT_AVAILABLE">NOT_AVAILABLE</option>
                </datalist>
              </td>
              <td>
                <input v-model="mapping.SYSTEM_NBR" list="system-nbr-options" class="full-width-input" placeholder="Enter or select">
                <datalist id="system-nbr-options">
                  <option value="ALL">ALL</option>
                </datalist>
              </td>
              <td>
                <input v-model="mapping.PRIN_NBR" list="prin-nbr-options" class="full-width-input" placeholder="Enter or select">
                <datalist id="prin-nbr-options">
                  <option value="ALL">ALL</option>
                </datalist>
              </td>
              <td>
                <input v-model="mapping.AGENT_NBR" list="agent-nbr-options" class="full-width-input" placeholder="Enter or select">
                <datalist id="agent-nbr-options">
                  <option value="ALL">ALL</option>
                </datalist>
              </td>
              <td>
                <button v-if="mapping.isCustom" @click="removeCustomMapping(index)" class="btn-danger-small">
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay">
      <div class="modal-content">
        <h3>Confirm Delete</h3>
        <p>Are you sure you want to delete all mapping data for this Product, Step, Target, and Source?</p>
        <div class="form-actions">
          <button @click="deleteMapping" class="btn-danger" :disabled="deleting">
            {{ deleting ? 'Deleting...' : 'Yes, Delete' }}
          </button>
          <button @click="showDeleteModal = false" :disabled="deleting">Cancel</button>
        </div>
      </div>
    </div>

    <!-- Error Modal -->
    <div v-if="showErrorModal" class="modal-overlay">
      <div class="modal-content">
        <h3>Error</h3>
        <p>{{ errorMessage }}</p>
        <div class="form-actions">
          <button @click="clearError" class="btn-primary">OK</button>
        </div>
      </div>
    </div>

    <!-- Progress Modal -->
    <div v-if="showProgressModal" class="modal-overlay">
      <div class="modal-content">
        <h3>Processing</h3>
        <p>{{ progressMessage }}</p>
        <p>{{ currentProgress }} of {{ totalProgress }} records processed</p>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
        </div>
      </div>
    </div>
    
    <!-- Success Modal -->
    <div v-if="showSuccessModal" class="modal-overlay">
      <div class="modal-content">
        <h3>Success</h3>
        <p>{{ successMessage }}</p>
        <div class="form-actions">
          <button @click="showSuccessModal = false" class="btn-primary">OK</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { generateClient } from 'aws-amplify/api';
import * as queries from '../graphql/queries';
import * as mutations from '../graphql/mutations';
import { createServiceParamMappingBatch, createServiceExprMappingBatch } from '../graphql.ts';
import ThemeToggle from './ThemeToggle.vue';
import { useErrorHandler } from '../composables/useErrorHandler';
import { getCurrentDateString } from '../utils/dateUtils';
import type { OriginProduct, Service, ServiceParam } from '../types';

const props = defineProps({
  productId: {
    type: Number,
    required: false,
    default: null
  }
});



// Reactive data
const products = ref([]);
const selectedProductId = ref('');
const selectedProduct = ref(null);
const resourceNames = ref([]);
const stepTypes = ref([]);
const allServices = ref([]);
const targetServices = ref([]);
const sourceParams = ref([]);
const mappings = ref([]);
const filteredMappings = ref([]);
const totalMappingCount = ref(0);

const selectedResourceName = ref('');
const selectedStepType = ref(null);
const selectedSourceService = ref(null);
const selectedTargetService = ref(null);

const mappingExists = ref(false);
const saving = ref(false);
const deleting = ref(false);
const showDeleteModal = ref(false);
const { error: errorMessage, showErrorModal, handleError, handleGraphQLError, clearError } = useErrorHandler();
const showSuccessModal = ref(false);
const showProgressModal = ref(false);
const successMessage = ref('');
const progressMessage = ref('');
const currentProgress = ref(0);
const totalProgress = ref(0);

const sortField = ref('');
const sortDirection = ref('asc');
const filters = ref({
  TARGET_PARAM_NAME: '',
  TARGET_EXPR: '',
  SOURCE_PARAM_NAME: '',
  SOURCE_EXPR: '',
  SYSTEM_NBR: '',
  PRIN_NBR: '',
  AGENT_NBR: ''
});
const isResizing = ref(false);
const resizeData = ref({ field: '', startX: 0, startWidth: 0 });

// Computed properties
const filteredStepTypes = computed(() => {
  return stepTypes.value.filter(step => step.RESOURCE_NAME === selectedResourceName.value);
});

const showActionButtons = computed(() => {
  return selectedStepType.value && selectedSourceService.value && selectedTargetService.value;
});

const showMappingTable = computed(() => {
  return selectedTargetService.value && mappings.value.length > 0;
});

const allSelected = computed(() => {
  return mappings.value.length > 0 && mappings.value.every(mapping => mapping.selected);
});

const progressPercentage = computed(() => 
  totalProgress.value > 0 ? (currentProgress.value / totalProgress.value) * 100 : 0
);

// Methods
const loadProducts = async () => {
  try {
    const result = await generateClient().graphql({ query: queries.listOriginProducts });
    products.value = result.data.listOrigin_products.items;
  } catch (error) {
    showError('Failed to load products');
  }
};

const onProductChange = async () => {
  if (selectedProductId.value) {
    selectedProduct.value = products.value.find(p => p.ORIGIN_PRODUCT_ID === parseInt(selectedProductId.value));
    await loadMappingCount();
  } else {
    selectedProduct.value = null;
    totalMappingCount.value = 0;
  }
  // Reset form controls
  selectedResourceName.value = '';
  selectedStepType.value = null;
  selectedSourceService.value = null;
  selectedTargetService.value = null;
  mappings.value = [];
};

const loadMappingCount = async () => {
  try {
    const productId = props.productId || parseInt(selectedProductId.value);
    if (!productId) return;
    
    const result = await generateClient().graphql({ query: queries.listServiceParamMappings });
    const productMappings = result.data.listSERVICE_PARAM_MAPPINGS.items.filter(
      mapping => mapping.ORIGIN_PRODUCT_ID === productId
    );
    totalMappingCount.value = productMappings.length;
  } catch (error) {
    console.error('Failed to load mapping count:', error);
  }
};

const loadResourceNames = async () => {
  try {
    const result = await generateClient().graphql({ query: queries.listStepTypes });
    const uniqueResources = [...new Set(result.data.listSTEP_TYPES.items.map(item => item.RESOURCE_NAME))];
    resourceNames.value = uniqueResources.sort();
  } catch (error) {
    showError('Failed to load resource names');
  }
};

const loadStepTypes = async () => {
  try {
    const result = await generateClient().graphql({ query: queries.listStepTypes });
    stepTypes.value = result.data.listSTEP_TYPES.items;
  } catch (error) {
    showError('Failed to load step types');
  }
};

const loadAllServices = async () => {
  try {
    const result = await generateClient().graphql({ query: queries.listServices });
    allServices.value = result.data.listSERVICES.items;
  } catch (error) {
    showError('Failed to load services');
  }
};

const onResourceNameChange = () => {
  selectedStepType.value = null;
  selectedSourceService.value = null;
  selectedTargetService.value = null;
  mappings.value = [];
};

const onStepTypeChange = async () => {
  selectedSourceService.value = null;
  selectedTargetService.value = null;
  mappings.value = [];
  
  if (selectedStepType.value) {
    await loadTargetServices();
  }
};

const loadTargetServices = async () => {
  try {
    const result = await generateClient().graphql({ query: queries.listStepServiceMappings });
    const stepServiceMappings = result.data.listSTEP_SERVICE_MAPPINGS.items.filter(
      mapping => mapping.STEP_TYPE_ID === selectedStepType.value.STEP_TYPE_ID
    );
    
    const serviceIds = stepServiceMappings.map(mapping => mapping.SERVICE_ID);
    targetServices.value = allServices.value.filter(service => serviceIds.includes(service.SERVICE_ID));
    
    // Auto-select if only one target service
    if (targetServices.value.length === 1) {
      selectedTargetService.value = targetServices.value[0];
      await onTargetServiceChange();
    }
  } catch (error) {
    showError('Failed to load target services');
  }
};

const onSourceServiceChange = async () => {
  if (selectedSourceService.value) {
    await loadSourceParams();
    await filterMappingsBySource();
  } else {
    // If no source service selected, show all mappings for the target
    await loadExistingMappingsForTarget();
  }
};

const onTargetServiceChange = async () => {
  if (selectedTargetService.value) {
    await loadTargetParams();
    await loadExistingMappingsForTarget();
  }
};

const loadSourceParams = async () => {
  try {
    let allParams = [];
    let nextToken = null;
    
    do {
      const variables = {
        filter: { SERVICE_ID: { eq: selectedSourceService.value.SERVICE_ID } },
        limit: 1000
      };
      if (nextToken) {
        variables.nextToken = nextToken;
      }
      
      const result = await generateClient().graphql({ 
        query: queries.listServiceParams,
        variables
      });
      
      if (result.data?.listSERVICE_PARAMS?.items) {
        allParams.push(...result.data.listSERVICE_PARAMS.items);
        nextToken = result.data.listSERVICE_PARAMS.nextToken;
      } else {
        nextToken = null;
      }
    } while (nextToken);
    
    sourceParams.value = allParams;
  } catch (error) {
    showError('Failed to load source parameters');
  }
};

const loadTargetParams = async () => {
  try {
    const result = await generateClient().graphql({ query: queries.listServiceParams });
    const targetParams = result.data.listSERVICE_PARAMS.items.filter(
      param => param.SERVICE_ID === selectedTargetService.value.SERVICE_ID
    );
    
    console.log('All SERVICE_PARAMS for target service', selectedTargetService.value.SERVICE_ID, ':', targetParams);
    
    mappings.value = targetParams.map(param => ({
      TARGET_SERVICE_PARAM_ID: param.SERVICE_PARAM_ID,
      TARGET_PARAM_NAME: param.PARAM_NAME,
      TARGET_EXPR: '',
      SOURCE_SERVICE_PARAM_ID: '',
      SOURCE_PARAM_NAME: '',
      SOURCE_EXPR: '',
      SYSTEM_NBR: 'ALL',
      PRIN_NBR: 'ALL',
      AGENT_NBR: 'ALL',
      selected: false,
      isCustom: false,
      isExisting: false
    }));
    
    applyFilters();
  } catch (error) {
    showError('Failed to load target parameters');
  }
};

const checkMappingExists = async () => {
  try {
    const productId = props.productId || parseInt(selectedProductId.value);
    const result = await generateClient().graphql({ query: queries.listServiceParamMappings });
    const existingMappings = result.data.listSERVICE_PARAM_MAPPINGS.items.filter(mapping => 
      mapping.ORIGIN_PRODUCT_ID === productId &&
      sourceParams.value.some(sp => sp.SERVICE_PARAM_ID === mapping.SOURCE_SERVICE_PARAM_ID) &&
      mappings.value.some(tm => tm.TARGET_SERVICE_PARAM_ID === mapping.TARGET_SERVICE_PARAM_ID)
    );
    
    mappingExists.value = existingMappings.length > 0;
    
    if (mappingExists.value) {
      await loadExistingMappings(existingMappings);
    }
  } catch (error) {
    showError('Failed to check existing mappings');
  }
};

const loadExistingMappingsForTarget = async () => {
  try {
    const productId = props.productId || parseInt(selectedProductId.value);
    const [paramMappingsResult, exprMappingsResult, allParamsResult] = await Promise.all([
      generateClient().graphql({ query: queries.listServiceParamMappings }),
      generateClient().graphql({ query: queries.listServiceExprMappings }),
      generateClient().graphql({ query: queries.listServiceParams })
    ]);
    
    const allParamMappings = paramMappingsResult.data.listSERVICE_PARAM_MAPPINGS.items;
    const allExprMappings = exprMappingsResult.data.listSERVICE_EXPR_MAPPINGS.items;
    const allParams = allParamsResult.data.listSERVICE_PARAMS.items;
    
    // Get all mappings for this product and target service
    const targetParamIds = mappings.value.map(m => m.TARGET_SERVICE_PARAM_ID);
    const existingMappings = allParamMappings.filter(mapping => 
      mapping.ORIGIN_PRODUCT_ID === productId &&
      targetParamIds.includes(mapping.TARGET_SERVICE_PARAM_ID)
    );
    
    // Update existing mappings with their data
    mappings.value.forEach(mapping => {
      const existing = existingMappings.find(em => em.TARGET_SERVICE_PARAM_ID === mapping.TARGET_SERVICE_PARAM_ID);
      if (existing) {
        const expr = allExprMappings.find(e => e.SERVICE_PARAM_MAPPING_ID === existing.SERVICE_PARAM_MAPPING_ID);
        const sourceParam = allParams.find(sp => sp.SERVICE_PARAM_ID === existing.SOURCE_SERVICE_PARAM_ID);
        
        mapping.SOURCE_SERVICE_PARAM_ID = existing.SOURCE_SERVICE_PARAM_ID;
        mapping.SOURCE_PARAM_NAME = sourceParam?.PARAM_NAME || '';
        mapping.SYSTEM_NBR = existing.SYSTEM_NBR || 'ALL';
        mapping.PRIN_NBR = existing.PRIN_NBR || 'ALL';
        mapping.AGENT_NBR = existing.AGENT_NBR || 'ALL';
        mapping.TARGET_EXPR = expr?.TARGET_EXPR || '';
        mapping.SOURCE_EXPR = expr?.SOURCE_EXPR || '';
        mapping.isExisting = true;
        mapping.selected = true;
        mapping.SERVICE_PARAM_MAPPING_ID = existing.SERVICE_PARAM_MAPPING_ID;
        mapping.SERVICE_EXPR_MAPPING_ID = expr?.SERVICE_EXPR_MAPPING_ID;
      } else {
        // Reset non-existing mappings
        mapping.SOURCE_SERVICE_PARAM_ID = '';
        mapping.SOURCE_PARAM_NAME = '';
        mapping.TARGET_EXPR = '';
        mapping.SOURCE_EXPR = '';
        mapping.SYSTEM_NBR = 'ALL';
        mapping.PRIN_NBR = 'ALL';
        mapping.AGENT_NBR = 'ALL';
        mapping.isExisting = false;
        mapping.selected = false;
      }
    });
    
    applyFilters();
  } catch (error) {
    console.error('Error loading existing mappings for target:', error);
    showError('Failed to load existing mapping details');
  }
};

const filterMappingsBySource = async () => {
  try {
    if (!selectedSourceService.value) return;
    
    const productId = props.productId || parseInt(selectedProductId.value);
    const [paramMappingsResult, exprMappingsResult] = await Promise.all([
      generateClient().graphql({ query: queries.listServiceParamMappings }),
      generateClient().graphql({ query: queries.listServiceExprMappings })
    ]);
    
    const allParamMappings = paramMappingsResult.data.listSERVICE_PARAM_MAPPINGS.items;
    const allExprMappings = exprMappingsResult.data.listSERVICE_EXPR_MAPPINGS.items;
    
    // Get source service param IDs
    const sourceServiceParamIds = sourceParams.value.map(sp => sp.SERVICE_PARAM_ID);
    
    // Filter mappings by product, target service, and source service
    const targetParamIds = mappings.value.map(m => m.TARGET_SERVICE_PARAM_ID);
    const filteredMappings = allParamMappings.filter(mapping => 
      mapping.ORIGIN_PRODUCT_ID === productId &&
      targetParamIds.includes(mapping.TARGET_SERVICE_PARAM_ID) &&
      sourceServiceParamIds.includes(mapping.SOURCE_SERVICE_PARAM_ID)
    );
    
    // Update mappings to show only those with the selected source service
    mappings.value.forEach(mapping => {
      const existing = filteredMappings.find(em => em.TARGET_SERVICE_PARAM_ID === mapping.TARGET_SERVICE_PARAM_ID);
      if (existing) {
        const expr = allExprMappings.find(e => e.SERVICE_PARAM_MAPPING_ID === existing.SERVICE_PARAM_MAPPING_ID);
        const sourceParam = sourceParams.value.find(sp => sp.SERVICE_PARAM_ID === existing.SOURCE_SERVICE_PARAM_ID);
        
        mapping.SOURCE_SERVICE_PARAM_ID = existing.SOURCE_SERVICE_PARAM_ID;
        mapping.SOURCE_PARAM_NAME = sourceParam?.PARAM_NAME || '';
        mapping.SYSTEM_NBR = existing.SYSTEM_NBR || 'ALL';
        mapping.PRIN_NBR = existing.PRIN_NBR || 'ALL';
        mapping.AGENT_NBR = existing.AGENT_NBR || 'ALL';
        mapping.TARGET_EXPR = expr?.TARGET_EXPR || '';
        mapping.SOURCE_EXPR = expr?.SOURCE_EXPR || '';
        mapping.isExisting = true;
        mapping.selected = true;
        mapping.SERVICE_PARAM_MAPPING_ID = existing.SERVICE_PARAM_MAPPING_ID;
        mapping.SERVICE_EXPR_MAPPING_ID = expr?.SERVICE_EXPR_MAPPING_ID;
      } else {
        // Reset mappings not associated with selected source service
        mapping.SOURCE_SERVICE_PARAM_ID = '';
        mapping.SOURCE_PARAM_NAME = '';
        mapping.TARGET_EXPR = '';
        mapping.SOURCE_EXPR = '';
        mapping.SYSTEM_NBR = 'ALL';
        mapping.PRIN_NBR = 'ALL';
        mapping.AGENT_NBR = 'ALL';
        mapping.isExisting = false;
        mapping.selected = false;
      }
    });
    
    mappingExists.value = filteredMappings.length > 0;
    applyFilters();
  } catch (error) {
    console.error('Error filtering mappings by source:', error);
    showError('Failed to filter mappings by source service');
  }
};

const loadExistingMappings = async (existingMappings) => {
  try {
    const exprResult = await generateClient().graphql({ query: queries.listServiceExprMappings });
    const expressions = exprResult.data.listSERVICE_EXPR_MAPPINGS.items;
    
    mappings.value.forEach(mapping => {
      const existing = existingMappings.find(em => em.TARGET_SERVICE_PARAM_ID === mapping.TARGET_SERVICE_PARAM_ID);
      if (existing) {
        const expr = expressions.find(e => e.SERVICE_PARAM_MAPPING_ID === existing.SERVICE_PARAM_MAPPING_ID);
        const sourceParam = sourceParams.value.find(sp => sp.SERVICE_PARAM_ID === existing.SOURCE_SERVICE_PARAM_ID);
        
        mapping.SOURCE_SERVICE_PARAM_ID = existing.SOURCE_SERVICE_PARAM_ID;
        mapping.SOURCE_PARAM_NAME = sourceParam?.PARAM_NAME || '';
        mapping.SYSTEM_NBR = existing.SYSTEM_NBR || 'ALL';
        mapping.PRIN_NBR = existing.PRIN_NBR || 'ALL';
        mapping.AGENT_NBR = existing.AGENT_NBR || 'ALL';
        mapping.TARGET_EXPR = expr?.TARGET_EXPR || '';
        mapping.SOURCE_EXPR = expr?.SOURCE_EXPR || '';
        mapping.isExisting = true;
        mapping.selected = true;
        mapping.SERVICE_PARAM_MAPPING_ID = existing.SERVICE_PARAM_MAPPING_ID;
        mapping.SERVICE_EXPR_MAPPING_ID = expr?.SERVICE_EXPR_MAPPING_ID;
      }
    });
  } catch (error) {
    console.error('Error loading existing mappings:', error);
    showError('Failed to load existing mapping details');
  }
};

const addCustomMapping = () => {
  const customMapping = {
    TARGET_SERVICE_PARAM_ID: null,
    TARGET_PARAM_NAME: '',
    TARGET_EXPR: '',
    SOURCE_SERVICE_PARAM_ID: '',
    SOURCE_PARAM_NAME: '',
    SOURCE_EXPR: '',
    SYSTEM_NBR: 'ALL',
    PRIN_NBR: 'ALL',
    AGENT_NBR: 'ALL',
    selected: true,
    isCustom: true,
    isExisting: false
  };
  
  mappings.value.unshift(customMapping);
  applyFilters();
};

const removeCustomMapping = (index) => {
  const actualIndex = mappings.value.findIndex(m => m === filteredMappings.value[index]);
  mappings.value.splice(actualIndex, 1);
  applyFilters();
};

const createMapping = async () => {
  saving.value = true;
  try {
    const selectedMappings = mappings.value.filter(m => m.selected);
    console.log('Selected mappings:', selectedMappings);
    
    showProgressModal.value = true;
    progressMessage.value = 'Creating mappings...';
    
    // Prepare batch inputs
    const paramMappingInputs = [];
    const exprMappingInputs = [];
    
    for (const mapping of selectedMappings) {
      let targetServiceParamId = mapping.TARGET_SERVICE_PARAM_ID;
      let sourceServiceParamId = mapping.SOURCE_SERVICE_PARAM_ID;
      
      console.log('Processing mapping:', mapping);
      
      // Handle custom params (create individually if needed)
      if (mapping.isCustom && !targetServiceParamId && mapping.TARGET_PARAM_NAME) {
        console.log('Creating custom target param:', mapping.TARGET_PARAM_NAME);
        
        // First check if parameter already exists
        const existingTargetParams = await generateClient().graphql({
          query: queries.listServiceParams,
          variables: {
            filter: {
              SERVICE_ID: { eq: selectedTargetService.value.SERVICE_ID },
              PARAM_NAME: { eq: mapping.TARGET_PARAM_NAME }
            }
          }
        });
        
        if (existingTargetParams.data.listSERVICE_PARAMS.items.length > 0) {
          targetServiceParamId = existingTargetParams.data.listSERVICE_PARAMS.items[0].SERVICE_PARAM_ID;
          console.log('Using existing target param ID:', targetServiceParamId);
        } else {
          const serviceParamResult = await generateClient().graphql({
            query: mutations.createServiceParam,
            variables: { input: {
              SERVICE_ID: selectedTargetService.value.SERVICE_ID,
              PARAM_NAME: mapping.TARGET_PARAM_NAME,
              CREATED_BY_USER_ID: 1,
              CREATED_DATE: getCurrentDateString()
            }}
          });
          targetServiceParamId = serviceParamResult.data.createSERVICE_PARAM.SERVICE_PARAM_ID;
          console.log('Created target param with ID:', targetServiceParamId);
          console.log('Full createSERVICE_PARAM result:', serviceParamResult);
        }
      }
      
      if (mapping.SOURCE_PARAM_NAME && !sourceServiceParamId) {
        const existingSourceParam = sourceParams.value.find(sp => sp.PARAM_NAME === mapping.SOURCE_PARAM_NAME);
        if (!existingSourceParam) {
          console.log('Creating new source param:', mapping.SOURCE_PARAM_NAME);
          
          // Double-check in database to avoid duplicates
          const existingSourceParams = await generateClient().graphql({
            query: queries.listServiceParams,
            variables: {
              filter: {
                SERVICE_ID: { eq: selectedSourceService.value.SERVICE_ID },
                PARAM_NAME: { eq: mapping.SOURCE_PARAM_NAME }
              }
            }
          });
          
          if (existingSourceParams.data.listSERVICE_PARAMS.items.length > 0) {
            sourceServiceParamId = existingSourceParams.data.listSERVICE_PARAMS.items[0].SERVICE_PARAM_ID;
            console.log('Found existing source param ID:', sourceServiceParamId);
          } else {
            const sourceParamResult = await generateClient().graphql({
              query: mutations.createServiceParam,
              variables: { input: {
                SERVICE_ID: selectedSourceService.value.SERVICE_ID,
                PARAM_NAME: mapping.SOURCE_PARAM_NAME,
                CREATED_BY_USER_ID: 1,
                CREATED_DATE: getCurrentDateString()
              }}
            });
            sourceServiceParamId = sourceParamResult.data.createSERVICE_PARAM.SERVICE_PARAM_ID;
            console.log('Created source param with ID:', sourceServiceParamId);
          }
        } else {
          sourceServiceParamId = existingSourceParam.SERVICE_PARAM_ID;
          console.log('Using existing source param ID:', sourceServiceParamId);
        }
      }
      
      // Check if mapping already exists before adding to batch
      const existingMappings = await generateClient().graphql({
        query: queries.listServiceParamMappings,
        variables: {
          filter: {
            ORIGIN_PRODUCT_ID: { eq: props.productId || parseInt(selectedProductId.value) },
            SOURCE_SERVICE_PARAM_ID: { eq: sourceServiceParamId },
            TARGET_SERVICE_PARAM_ID: { eq: targetServiceParamId }
          }
        }
      });
      
      if (existingMappings.data.listSERVICE_PARAM_MAPPINGS.items.length === 0) {
        const paramInput = {
          ORIGIN_PRODUCT_ID: props.productId || parseInt(selectedProductId.value),
          SOURCE_SERVICE_PARAM_ID: sourceServiceParamId,
          TARGET_SERVICE_PARAM_ID: targetServiceParamId,
          SYSTEM_NBR: mapping.SYSTEM_NBR,
          PRIN_NBR: mapping.PRIN_NBR,
          AGENT_NBR: mapping.AGENT_NBR,
          CREATED_BY_USER_ID: 1,
          CREATED_DATE: getCurrentDateString()
        };
        
        console.log('Param mapping input:', paramInput);
        paramMappingInputs.push(paramInput);
      } else {
        console.log('Mapping already exists, skipping:', existingMappings.data.listSERVICE_PARAM_MAPPINGS.items[0]);
      }
    }
    
    console.log('All param mapping inputs:', paramMappingInputs);
    
    // Create param mappings in batch
    const paramResult = await createServiceParamMappingBatch(paramMappingInputs);
    console.log('Param mapping batch result:', paramResult);
    
    // Prepare expression mappings
    paramResult.data.createSERVICE_PARAM_MAPPINGBatch.items.forEach((item, index) => {
      const mapping = selectedMappings[index];
      if (mapping.TARGET_EXPR || mapping.SOURCE_EXPR) {
        exprMappingInputs.push({
          SERVICE_PARAM_MAPPING_ID: item.SERVICE_PARAM_MAPPING_ID,
          SOURCE_EXPR: mapping.SOURCE_EXPR,
          TARGET_EXPR: mapping.TARGET_EXPR,
          CREATED_BY_USER_ID: 1,
          CREATED_DATE: getCurrentDateString()
        });
      }
    });
    
    console.log('Expression mapping inputs:', exprMappingInputs);
    
    // Create expression mappings in batch if any
    if (exprMappingInputs.length > 0) {
      const exprResult = await createServiceExprMappingBatch(exprMappingInputs);
      console.log('Expression mapping batch result:', exprResult);
    }
    
    showProgressModal.value = false;
    successMessage.value = 'Mapping created successfully!';
    showSuccessModal.value = true;
    await loadTargetParams();
    await loadExistingMappingsForTarget();
  } catch (error) {
    console.error('Error in createMapping:', error);
    if (error.errors) {
      console.error('GraphQL errors:', error.errors);
      error.errors.forEach((err, index) => {
        console.error(`Error ${index + 1}:`, err.message);
      });
    }
    showProgressModal.value = false;
    const errorMsg = error.errors ? error.errors.map(e => e.message).join('; ') : (error.message || error);
    showError(`Failed to create mapping: ${errorMsg}`);
  } finally {
    saving.value = false;
  }
};

const updateMapping = async () => {
  saving.value = true;
  try {
    const selectedMappings = mappings.value.filter(m => m.selected);
    const unselectedExisting = mappings.value.filter(m => !m.selected && m.isExisting);
    
    console.log('Selected mappings for update:', selectedMappings);
    console.log('Unselected existing mappings:', unselectedExisting);
    
    // Show progress modal
    totalProgress.value = unselectedExisting.length + selectedMappings.length;
    currentProgress.value = 0;
    progressMessage.value = 'Updating mappings...';
    showProgressModal.value = true;
    
    // Delete unselected existing mappings
    for (let i = 0; i < unselectedExisting.length; i++) {
      const mapping = unselectedExisting[i];
      currentProgress.value = i + 1;
      if (mapping.SERVICE_EXPR_MAPPING_ID) {
        await generateClient().graphql({
          query: mutations.deleteServiceExprMapping,
          variables: { input: { SERVICE_EXPR_MAPPING_ID: mapping.SERVICE_EXPR_MAPPING_ID } }
        });
      }
      
      await generateClient().graphql({
        query: mutations.deleteServiceParamMapping,
        variables: { input: { SERVICE_PARAM_MAPPING_ID: mapping.SERVICE_PARAM_MAPPING_ID } }
      });
    }
    
    // Update or create selected mappings
    for (let i = 0; i < selectedMappings.length; i++) {
      const mapping = selectedMappings[i];
      currentProgress.value = unselectedExisting.length + i + 1;
      console.log('Processing mapping for update:', mapping);
      
      if (mapping.isExisting) {
        // Update existing
        const paramMappingInput = {
          SERVICE_PARAM_MAPPING_ID: mapping.SERVICE_PARAM_MAPPING_ID,
          SYSTEM_NBR: mapping.SYSTEM_NBR,
          PRIN_NBR: mapping.PRIN_NBR,
          AGENT_NBR: mapping.AGENT_NBR
        };
        
        await generateClient().graphql({
          query: mutations.updateServiceParamMapping,
          variables: { input: paramMappingInput }
        });
        
        // Update or create expression mapping
        if (mapping.TARGET_EXPR || mapping.SOURCE_EXPR) {
          if (mapping.SERVICE_EXPR_MAPPING_ID) {
            const exprMappingInput = {
              SERVICE_EXPR_MAPPING_ID: mapping.SERVICE_EXPR_MAPPING_ID,
              SOURCE_EXPR: mapping.SOURCE_EXPR,
              TARGET_EXPR: mapping.TARGET_EXPR
            };
            
            await generateClient().graphql({
              query: mutations.updateServiceExprMapping,
              variables: { input: exprMappingInput }
            });
          } else {
            const exprMappingInput = {
              SERVICE_PARAM_MAPPING_ID: mapping.SERVICE_PARAM_MAPPING_ID,
              SOURCE_EXPR: mapping.SOURCE_EXPR,
              TARGET_EXPR: mapping.TARGET_EXPR,
              CREATED_BY_USER_ID: 1,
              CREATED_DATE: getCurrentDateString()
            };
            
            await generateClient().graphql({
              query: mutations.createServiceExprMapping,
              variables: { input: exprMappingInput }
            });
          }
        }
      } else {
        // Create new
        let targetServiceParamId = mapping.TARGET_SERVICE_PARAM_ID;
        let sourceServiceParamId = mapping.SOURCE_SERVICE_PARAM_ID;
        
        // If custom mapping without existing TARGET_SERVICE_PARAM_ID, create new SERVICE_PARAM
        if (mapping.isCustom && !targetServiceParamId && mapping.TARGET_PARAM_NAME) {
          console.log('Creating custom target param in update:', mapping.TARGET_PARAM_NAME);
          
          // First check if parameter already exists
          const existingTargetParams = await generateClient().graphql({
            query: queries.listServiceParams,
            variables: {
              filter: {
                SERVICE_ID: { eq: selectedTargetService.value.SERVICE_ID },
                PARAM_NAME: { eq: mapping.TARGET_PARAM_NAME }
              }
            }
          });
          
          if (existingTargetParams.data.listSERVICE_PARAMS.items.length > 0) {
            targetServiceParamId = existingTargetParams.data.listSERVICE_PARAMS.items[0].SERVICE_PARAM_ID;
            console.log('Using existing target param ID in update:', targetServiceParamId);
          } else {
            const serviceParamResult = await generateClient().graphql({
              query: mutations.createServiceParam,
              variables: { input: {
                SERVICE_ID: selectedTargetService.value.SERVICE_ID,
                PARAM_NAME: mapping.TARGET_PARAM_NAME,
                CREATED_BY_USER_ID: 1,
                CREATED_DATE: getCurrentDateString()
              }}
            });
            targetServiceParamId = serviceParamResult.data.createSERVICE_PARAM.SERVICE_PARAM_ID;
            console.log('Created target param with ID in update:', targetServiceParamId);
          }
        }
        
        // Check if source param exists, create if not
        if (mapping.SOURCE_PARAM_NAME && !sourceServiceParamId) {
          const existingSourceParam = sourceParams.value.find(sp => sp.PARAM_NAME === mapping.SOURCE_PARAM_NAME);
          if (!existingSourceParam) {
            console.log('Creating new source param in update:', mapping.SOURCE_PARAM_NAME);
            
            // Double-check in database to avoid duplicates
            const existingSourceParams = await generateClient().graphql({
              query: queries.listServiceParams,
              variables: {
                filter: {
                  SERVICE_ID: { eq: selectedSourceService.value.SERVICE_ID },
                  PARAM_NAME: { eq: mapping.SOURCE_PARAM_NAME }
                }
              }
            });
            
            if (existingSourceParams.data.listSERVICE_PARAMS.items.length > 0) {
              sourceServiceParamId = existingSourceParams.data.listSERVICE_PARAMS.items[0].SERVICE_PARAM_ID;
              console.log('Found existing source param ID in update:', sourceServiceParamId);
            } else {
              const sourceParamResult = await generateClient().graphql({
                query: mutations.createServiceParam,
                variables: { input: {
                  SERVICE_ID: selectedSourceService.value.SERVICE_ID,
                  PARAM_NAME: mapping.SOURCE_PARAM_NAME,
                  CREATED_BY_USER_ID: 1,
                  CREATED_DATE: getCurrentDateString()
                }}
              });
              sourceServiceParamId = sourceParamResult.data.createSERVICE_PARAM.SERVICE_PARAM_ID;
              console.log('Created source param with ID in update:', sourceServiceParamId);
            }
          } else {
            sourceServiceParamId = existingSourceParam.SERVICE_PARAM_ID;
            console.log('Using existing source param ID in update:', sourceServiceParamId);
          }
        }
        
        // Check if mapping already exists
        const existingMappings = await generateClient().graphql({
          query: queries.listServiceParamMappings,
          variables: {
            filter: {
              ORIGIN_PRODUCT_ID: { eq: props.productId || parseInt(selectedProductId.value) },
              SOURCE_SERVICE_PARAM_ID: { eq: sourceServiceParamId },
              TARGET_SERVICE_PARAM_ID: { eq: targetServiceParamId }
            }
          }
        });
        
        let paramResult;
        if (existingMappings.data.listSERVICE_PARAM_MAPPINGS.items.length > 0) {
          // Use existing mapping
          paramResult = {
            data: {
              createSERVICE_PARAM_MAPPING: existingMappings.data.listSERVICE_PARAM_MAPPINGS.items[0]
            }
          };
          console.log('Using existing param mapping:', paramResult.data.createSERVICE_PARAM_MAPPING);
        } else {
          // Create new mapping
          const paramMappingInput = {
            ORIGIN_PRODUCT_ID: props.productId || parseInt(selectedProductId.value),
            SOURCE_SERVICE_PARAM_ID: sourceServiceParamId,
            TARGET_SERVICE_PARAM_ID: targetServiceParamId,
            SYSTEM_NBR: mapping.SYSTEM_NBR,
            PRIN_NBR: mapping.PRIN_NBR,
            AGENT_NBR: mapping.AGENT_NBR,
            CREATED_BY_USER_ID: 1,
            CREATED_DATE: getCurrentDateString()
          };
          
          console.log('Creating param mapping in update:', paramMappingInput);
          
          paramResult = await generateClient().graphql({
            query: mutations.createServiceParamMapping,
            variables: { input: paramMappingInput }
          });
        }
        
        if (mapping.TARGET_EXPR || mapping.SOURCE_EXPR) {
          const exprMappingInput = {
            SERVICE_PARAM_MAPPING_ID: paramResult.data.createSERVICE_PARAM_MAPPING.SERVICE_PARAM_MAPPING_ID,
            SOURCE_EXPR: mapping.SOURCE_EXPR,
            TARGET_EXPR: mapping.TARGET_EXPR,
            CREATED_BY_USER_ID: 1,
            CREATED_DATE: getCurrentDateString()
          };
          
          await generateClient().graphql({
            query: mutations.createServiceExprMapping,
            variables: { input: exprMappingInput }
          });
        }
      }
    }
    
    showProgressModal.value = false;
    successMessage.value = 'Mapping updated successfully!';
    showSuccessModal.value = true;
    await loadTargetParams();
    await loadExistingMappingsForTarget();
  } catch (error) {
    console.error('Error in updateMapping:', error);
    if (error.errors) {
      console.error('GraphQL errors:', error.errors);
      error.errors.forEach((err, index) => {
        console.error(`Error ${index + 1}:`, err.message);
      });
    }
    showProgressModal.value = false;
    const errorMsg = error.errors ? error.errors.map(e => e.message).join('; ') : (error.message || error);
    showError(`Failed to update mapping: ${errorMsg}`);
  } finally {
    saving.value = false;
  }
};

const confirmDeleteMapping = () => {
  showDeleteModal.value = true;
};

const deleteMapping = async () => {
  deleting.value = true;
  try {
    const productId = props.productId || parseInt(selectedProductId.value);
    const result = await generateClient().graphql({ query: queries.listServiceParamMappings });
    const mappingsToDelete = result.data.listSERVICE_PARAM_MAPPINGS.items.filter(mapping => 
      mapping.ORIGIN_PRODUCT_ID === productId &&
      sourceParams.value.some(sp => sp.SERVICE_PARAM_ID === mapping.SOURCE_SERVICE_PARAM_ID) &&
      mappings.value.some(tm => tm.TARGET_SERVICE_PARAM_ID === mapping.TARGET_SERVICE_PARAM_ID)
    );
    
    // Delete expression mappings first
    const exprResult = await generateClient().graphql({ query: queries.listServiceExprMappings });
    const expressionsToDelete = exprResult.data.listSERVICE_EXPR_MAPPINGS.items.filter(expr =>
      mappingsToDelete.some(m => m.SERVICE_PARAM_MAPPING_ID === expr.SERVICE_PARAM_MAPPING_ID)
    );
    
    for (const expr of expressionsToDelete) {
      await generateClient().graphql({
        query: mutations.deleteServiceExprMapping,
        variables: { input: { SERVICE_EXPR_MAPPING_ID: expr.SERVICE_EXPR_MAPPING_ID } }
      });
    }
    
    // Delete param mappings
    for (const mapping of mappingsToDelete) {
      await generateClient().graphql({
        query: mutations.deleteServiceParamMapping,
        variables: { input: { SERVICE_PARAM_MAPPING_ID: mapping.SERVICE_PARAM_MAPPING_ID } }
      });
    }
    
    showDeleteModal.value = false;
    successMessage.value = 'Mapping deleted successfully!';
    showSuccessModal.value = true;
    
    // Reset form
    selectedResourceName.value = '';
    selectedStepType.value = null;
    selectedSourceService.value = null;
    selectedTargetService.value = null;
    mappings.value = [];
    mappingExists.value = false;
  } catch (error) {
    showError('Failed to delete mapping');
  } finally {
    deleting.value = false;
  }
};

const toggleSelectAll = () => {
  const newValue = !allSelected.value;
  mappings.value.forEach(mapping => {
    mapping.selected = newValue;
  });
};

const applyFilters = () => {
  let filtered = mappings.value.filter(mapping => {
    return (!filters.value.TARGET_PARAM_NAME || mapping.TARGET_PARAM_NAME.toLowerCase().includes(filters.value.TARGET_PARAM_NAME.toLowerCase())) &&
           (!filters.value.TARGET_EXPR || mapping.TARGET_EXPR.toLowerCase().includes(filters.value.TARGET_EXPR.toLowerCase())) &&
           (!filters.value.SOURCE_PARAM_NAME || mapping.SOURCE_PARAM_NAME.toLowerCase().includes(filters.value.SOURCE_PARAM_NAME.toLowerCase())) &&
           (!filters.value.SOURCE_EXPR || mapping.SOURCE_EXPR.toLowerCase().includes(filters.value.SOURCE_EXPR.toLowerCase())) &&
           (!filters.value.SYSTEM_NBR || mapping.SYSTEM_NBR.toLowerCase().includes(filters.value.SYSTEM_NBR.toLowerCase())) &&
           (!filters.value.PRIN_NBR || mapping.PRIN_NBR.toLowerCase().includes(filters.value.PRIN_NBR.toLowerCase())) &&
           (!filters.value.AGENT_NBR || mapping.AGENT_NBR.toLowerCase().includes(filters.value.AGENT_NBR.toLowerCase()));
  });
  
  // Sort existing mappings to the top, then apply user sorting
  filtered.sort((a, b) => {
    // First sort by existing mappings (existing mappings first)
    if (a.isExisting !== b.isExisting) {
      return b.isExisting ? 1 : -1;
    }
    
    // Then apply user sorting if specified
    if (sortField.value) {
      const aVal = String(a[sortField.value] || '').toLowerCase();
      const bVal = String(b[sortField.value] || '').toLowerCase();
      const comparison = aVal.localeCompare(bVal);
      return sortDirection.value === 'asc' ? comparison : -comparison;
    }
    
    return 0;
  });
  
  filteredMappings.value = filtered;
};

const clearFilters = () => {
  filters.value = {
    TARGET_PARAM_NAME: '',
    TARGET_EXPR: '',
    SOURCE_PARAM_NAME: '',
    SOURCE_EXPR: '',
    SYSTEM_NBR: '',
    PRIN_NBR: '',
    AGENT_NBR: ''
  };
  applyFilters();
};

const sortBy = (field) => {
  if (sortField.value === field) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortField.value = field;
    sortDirection.value = 'asc';
  }
  applyFilters();
};

const showError = (message: string) => handleError({ message }, 'mapping operation');

const startResize = (event, field) => {
  isResizing.value = true;
  resizeData.value.field = field;
  resizeData.value.startX = event.clientX;
  const th = event.target.parentElement;
  resizeData.value.startWidth = th.offsetWidth;
  
  document.addEventListener('mousemove', doResize);
  document.addEventListener('mouseup', stopResize);
  event.preventDefault();
};

const doResize = (event) => {
  if (!isResizing.value) return;
  const diff = event.clientX - resizeData.value.startX;
  const minWidth = resizeData.value.field === 'TARGET_PARAM_NAME' ? 80 : 50;
  const newWidth = Math.max(minWidth, resizeData.value.startWidth + diff);
  const th = document.querySelector(`th[data-field="${resizeData.value.field}"]`);
  if (th) {
    th.style.width = newWidth + 'px';
  }
};

const stopResize = () => {
  isResizing.value = false;
  document.removeEventListener('mousemove', doResize);
  document.removeEventListener('mouseup', stopResize);
};

onMounted(async () => {
  await Promise.all([
    loadProducts(),
    loadResourceNames(),
    loadStepTypes(),
    loadAllServices()
  ]);
  
  // If productId prop is provided, set up product info
  if (props.productId) {
    selectedProductId.value = props.productId.toString();
    await onProductChange();
  }
});
</script>

<style scoped>
.mapping-manager {
  width: 100%;
  height: 100%;
  padding: 20px;
  overflow: auto;
  background-color: var(--bg-color);
  color: var(--text-color);
}

.bordered-section {
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 15px;
  margin-bottom: 20px;
  width: fit-content;
  background-color: var(--bg-color);
}

.bordered-section label {
  display: inline-block;
  margin-right: 10px;
  font-weight: bold;
}

.bordered-section select {
  padding: 8px;
  min-width: 400px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background-color: var(--input-bg);
  color: var(--text-color);
}

.product-info {
  margin-top: 15px;
}

.buttons-params-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 20px;
}

.target-params-info {
  width: fit-content;
}

.form-controls {
  display: flex;
  flex-direction: row;
  gap: 15px;
  flex-wrap: wrap;
}

.form-controls .form-group {
  min-width: 200px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  margin-bottom: 5px;
  font-weight: bold;
}

.form-group select {
  padding: 8px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  min-width: 200px;
  background-color: var(--input-bg);
  color: var(--text-color);
}

.action-buttons button {
  margin-right: 10px;
}

.mapping-table-section {
  margin-bottom: 20px;
}

.table-container {
  max-height: 600px;
  overflow: auto;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background-color: var(--bg-color);
}

.mapping-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
  table-layout: fixed;
}

.mapping-table th,
.mapping-table td {
  border: 1px solid var(--border-color);
  padding: 8px;
  text-align: left;
  background-color: var(--bg-color);
  color: var(--text-color);
}

.mapping-table th {
  background-color: var(--table-header-bg);
  position: sticky;
  top: 0;
  z-index: 10;
  height: 45px;
  vertical-align: middle;
}

.filter-row th {
  background-color: var(--table-filter-bg);
  padding: 4px;
  position: sticky;
  top: 45px;
  z-index: 10;
  height: 35px;
}

.filter-input {
  width: 100%;
  padding: 4px;
  font-size: 12px;
  border: 1px solid #ccc;
  border-radius: 3px;
}

.clear-filters-btn {
  padding: 4px 8px;
  font-size: 12px;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;
}

.full-width-input {
  width: 100%;
  padding: 4px;
  border: 1px solid var(--border-color);
  border-radius: 3px;
  box-sizing: border-box;
  background-color: var(--input-bg);
  color: var(--text-color);
}

.read-only-text {
  display: block;
  width: 100%;
  padding: 4px;
  word-wrap: break-word;
  white-space: normal;
  line-height: 1.4;
}

.sortable {
  cursor: pointer;
  user-select: none;
}

.sortable:hover {
  background-color: var(--table-filter-bg);
}

.sort-indicator {
  margin-left: 5px;
  font-weight: bold;
}

.w-12 {
  width: 3%;
}

.text-center {
  text-align: center;
}

.resizable {
  position: relative;
  user-select: none;
}

.resize-handle {
  position: absolute;
  top: 0;
  right: 0;
  width: 5px;
  height: 100%;
  cursor: col-resize;
  background: transparent;
}

.resize-handle:hover {
  background: #007bff;
}

th[data-field="TARGET_PARAM_NAME"],
td:nth-child(2) {
  width: 30%;
}

th[data-field="SOURCE_PARAM_NAME"],
td:nth-child(4) {
  width: 30%;
}

th[data-field="TARGET_EXPR"],
td:nth-child(3) {
  width: 10%;
}

th[data-field="SOURCE_EXPR"],
td:nth-child(5) {
  width: 10%;
}

.nbr-column {
  width: 5%;
}

th:last-child {
  width: 7%;
}

td input {
  width: 100%;
  box-sizing: border-box;
}

.btn-danger-small {
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 3px;
  padding: 4px 8px;
  font-size: 12px;
  cursor: pointer;
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
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: var(--modal-bg);
  color: var(--text-color);
  padding: 30px;
  border-radius: 8px;
  min-width: 400px;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
}

.form-actions {
  margin-top: 15px;
  text-align: center;
}

.progress-bar {
  width: 100%;
  height: 20px;
  background-color: #f0f0f0;
  border-radius: 10px;
  overflow: hidden;
  margin-top: 15px;
}

.progress-fill {
  height: 100%;
  background-color: #007bff;
  transition: width 0.3s ease;
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

@media (max-width: 768px) {
  .header-row {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }
}
</style>
