<template>
  <div class="mapping-manager">
    <h2>Service Mapping Manager</h2>
    
    <!-- Product Info and Form Controls -->
    <div class="top-section">
      <div v-if="selectedProduct" class="product-info">
        <h3>Product Information</h3>
        <p><strong>Product ID:</strong> {{ selectedProduct.PRODUCT_ID }}</p>
        <p><strong>PSCU Client ID:</strong> {{ selectedProduct.PSCU_CLIENT_ID }}</p>
        <p><strong>Partner Code:</strong> {{ selectedProduct.PARTNER_CODE }}</p>
        <p><strong>Description:</strong> {{ selectedProduct.PRODUCT_DESC }}</p>
      </div>

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
          <label>Source Service:</label>
          <select v-model="selectedSourceService" @change="onSourceServiceChange" :disabled="!selectedStepType">
            <option value="">-- Select Source Service --</option>
            <option v-for="service in allServices" :key="service.SERVICE_ID" :value="service">
              {{ service.SERVICE_ID }}: {{ service.URI }}
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
      </div>
    </div>

    <!-- Action Buttons -->
    <div v-if="showActionButtons" class="action-buttons">
      <button v-if="!mappingExists" @click="createMapping" :disabled="saving" class="btn-success">
        {{ saving ? 'Creating...' : 'Create Mapping' }}
      </button>
      <button v-if="mappingExists" @click="updateMapping" :disabled="saving" class="btn-primary">
        {{ saving ? 'Updating...' : 'Update Mapping' }}
      </button>
      <button v-if="mappingExists" @click="confirmDeleteMapping" class="btn-danger">
        Delete Mapping
      </button>
      <button @click="addCustomMapping" class="btn-success">Add Custom Mapping</button>
    </div>

    <!-- Mapping Table -->
    <div v-if="showMappingTable" class="mapping-table-section">
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
            <th></th>
            <th></th>
            <th></th>
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
              <input v-if="mapping.isCustom" v-model="mapping.TARGET_PARAM_NAME" class="param-input" placeholder="Enter parameter name">
              <span v-else>{{ mapping.TARGET_PARAM_NAME }}</span>
            </td>
            <td>
              <input v-model="mapping.TARGET_EXPR" list="target-expr-options" class="expr-input" placeholder="Enter or select">
              <datalist id="target-expr-options">
                <option value="PASSTHRU">PASSTHRU</option>
                <option value="TRUE">TRUE</option>
                <option value="FALSE">FALSE</option>
              </datalist>
            </td>
            <td>
              <input v-model="mapping.SOURCE_PARAM_NAME" list="source-param-options" class="param-input" placeholder="Enter or select source param">
              <datalist id="source-param-options">
                <option v-for="param in sourceParams" :key="param.SERVICE_PARAM_ID" :value="param.PARAM_NAME">
                  {{ param.SERVICE_PARAM_ID }}: {{ param.PARAM_NAME }}
                </option>
              </datalist>
            </td>
            <td>
              <input v-model="mapping.SOURCE_EXPR" list="source-expr-options" class="expr-input" placeholder="Enter or select">
              <datalist id="source-expr-options">
                <option value="ALL">ALL</option>
                <option value="NOT_AVAILABLE">NOT_AVAILABLE</option>
              </datalist>
            </td>
            <td>
              <input v-model="mapping.SYSTEM_NBR" list="system-nbr-options" class="nbr-input" placeholder="Enter or select">
              <datalist id="system-nbr-options">
                <option value="ALL">ALL</option>
              </datalist>
            </td>
            <td>
              <input v-model="mapping.PRIN_NBR" list="prin-nbr-options" class="nbr-input" placeholder="Enter or select">
              <datalist id="prin-nbr-options">
                <option value="ALL">ALL</option>
              </datalist>
            </td>
            <td>
              <input v-model="mapping.AGENT_NBR" list="agent-nbr-options" class="nbr-input" placeholder="Enter or select">
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
          <button @click="showErrorModal = false" class="btn-primary">OK</button>
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
import { ref, computed, onMounted, defineProps } from 'vue';
import { generateClient } from 'aws-amplify/api';
import * as queries from '../graphql/queries';
import * as mutations from '../graphql/mutations';
import { createServiceParamMappingBatch, createServiceExprMappingBatch } from '../graphql.ts';

const props = defineProps({
  productId: {
    type: Number,
    required: true
  }
});

const client = generateClient();

// Reactive data
const selectedProduct = ref(null);
const resourceNames = ref([]);
const stepTypes = ref([]);
const allServices = ref([]);
const targetServices = ref([]);
const sourceParams = ref([]);
const mappings = ref([]);
const filteredMappings = ref([]);

const selectedResourceName = ref('');
const selectedStepType = ref(null);
const selectedSourceService = ref(null);
const selectedTargetService = ref(null);

const mappingExists = ref(false);
const saving = ref(false);
const deleting = ref(false);
const showDeleteModal = ref(false);
const showErrorModal = ref(false);
const showSuccessModal = ref(false);
const showProgressModal = ref(false);
const errorMessage = ref('');
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
  SOURCE_EXPR: ''
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
const loadProductInfo = async () => {
  try {
    const result = await client.graphql({ query: queries.listOriginProducts });
    const product = result.data.listOrigin_products.items.find(p => p.ORIGIN_PRODUCT_ID === props.productId);
    selectedProduct.value = product;
  } catch (error) {
    showError('Failed to load product information');
  }
};

const loadResourceNames = async () => {
  try {
    const result = await client.graphql({ query: queries.listStepTypes });
    const uniqueResources = [...new Set(result.data.listSTEP_TYPES.items.map(item => item.RESOURCE_NAME))];
    resourceNames.value = uniqueResources.sort();
  } catch (error) {
    showError('Failed to load resource names');
  }
};

const loadStepTypes = async () => {
  try {
    const result = await client.graphql({ query: queries.listStepTypes });
    stepTypes.value = result.data.listSTEP_TYPES.items;
  } catch (error) {
    showError('Failed to load step types');
  }
};

const loadAllServices = async () => {
  try {
    const result = await client.graphql({ query: queries.listServices });
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
    const result = await client.graphql({ query: queries.listStepServiceMappings });
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
    await checkMappingExists();
  }
};

const onTargetServiceChange = async () => {
  if (selectedTargetService.value) {
    await loadTargetParams();
    if (selectedSourceService.value) {
      await checkMappingExists();
    }
  }
};

const loadSourceParams = async () => {
  try {
    const result = await client.graphql({ query: queries.listServiceParams });
    sourceParams.value = result.data.listSERVICE_PARAMS.items.filter(
      param => param.SERVICE_ID === selectedSourceService.value.SERVICE_ID
    );
  } catch (error) {
    showError('Failed to load source parameters');
  }
};

const loadTargetParams = async () => {
  try {
    const result = await client.graphql({ query: queries.listServiceParams });
    const targetParams = result.data.listSERVICE_PARAMS.items.filter(
      param => param.SERVICE_ID === selectedTargetService.value.SERVICE_ID
    );
    
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
    const result = await client.graphql({ query: queries.listServiceParamMappings });
    const existingMappings = result.data.listSERVICE_PARAM_MAPPINGS.items.filter(mapping => 
      mapping.ORIGIN_PRODUCT_ID === props.productId &&
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

const loadExistingMappings = async (existingMappings) => {
  try {
    const exprResult = await client.graphql({ query: queries.listServiceExprMappings });
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
    
    showProgressModal.value = true;
    progressMessage.value = 'Creating mappings...';
    
    // Prepare batch inputs
    const paramMappingInputs = [];
    const exprMappingInputs = [];
    
    for (const mapping of selectedMappings) {
      let targetServiceParamId = mapping.TARGET_SERVICE_PARAM_ID;
      let sourceServiceParamId = mapping.SOURCE_SERVICE_PARAM_ID;
      
      // Handle custom params (create individually if needed)
      if (mapping.isCustom && !targetServiceParamId && mapping.TARGET_PARAM_NAME) {
        const serviceParamResult = await client.graphql({
          query: mutations.createServiceParam,
          variables: { input: {
            SERVICE_ID: selectedTargetService.value.SERVICE_ID,
            PARAM_NAME: mapping.TARGET_PARAM_NAME,
            CREATED_BY_USER_ID: 1,
            CREATED_DATE: new Date().toISOString().split('T')[0]
          }}
        });
        targetServiceParamId = serviceParamResult.data.createSERVICE_PARAM.SERVICE_PARAM_ID;
      }
      
      if (mapping.SOURCE_PARAM_NAME && !sourceServiceParamId) {
        const existingSourceParam = sourceParams.value.find(sp => sp.PARAM_NAME === mapping.SOURCE_PARAM_NAME);
        if (!existingSourceParam) {
          const sourceParamResult = await client.graphql({
            query: mutations.createServiceParam,
            variables: { input: {
              SERVICE_ID: selectedSourceService.value.SERVICE_ID,
              PARAM_NAME: mapping.SOURCE_PARAM_NAME,
              CREATED_BY_USER_ID: 1,
              CREATED_DATE: new Date().toISOString().split('T')[0]
            }}
          });
          sourceServiceParamId = sourceParamResult.data.createSERVICE_PARAM.SERVICE_PARAM_ID;
        } else {
          sourceServiceParamId = existingSourceParam.SERVICE_PARAM_ID;
        }
      }
      
      paramMappingInputs.push({
        ORIGIN_PRODUCT_ID: props.productId,
        SOURCE_SERVICE_PARAM_ID: sourceServiceParamId,
        TARGET_SERVICE_PARAM_ID: targetServiceParamId,
        SYSTEM_NBR: mapping.SYSTEM_NBR,
        PRIN_NBR: mapping.PRIN_NBR,
        AGENT_NBR: mapping.AGENT_NBR,
        CREATED_BY_USER_ID: 1,
        CREATED_DATE: new Date().toISOString().split('T')[0]
      });
    }
    
    // Create param mappings in batch
    const paramResult = await createServiceParamMappingBatch(paramMappingInputs);
    
    // Prepare expression mappings
    paramResult.data.createSERVICE_PARAM_MAPPINGBatch.items.forEach((item, index) => {
      const mapping = selectedMappings[index];
      if (mapping.TARGET_EXPR || mapping.SOURCE_EXPR) {
        exprMappingInputs.push({
          SERVICE_PARAM_MAPPING_ID: item.SERVICE_PARAM_MAPPING_ID,
          SOURCE_EXPR: mapping.SOURCE_EXPR,
          TARGET_EXPR: mapping.TARGET_EXPR,
          CREATED_BY_USER_ID: 1,
          CREATED_DATE: new Date().toISOString().split('T')[0]
        });
      }
    });
    
    // Create expression mappings in batch if any
    if (exprMappingInputs.length > 0) {
      await createServiceExprMappingBatch(exprMappingInputs);
    }
    
    showProgressModal.value = false;
    successMessage.value = 'Mapping created successfully!';
    showSuccessModal.value = true;
    await checkMappingExists();
  } catch (error) {
    showProgressModal.value = false;
    showError('Failed to create mapping');
  } finally {
    saving.value = false;
  }
};

const updateMapping = async () => {
  saving.value = true;
  try {
    const selectedMappings = mappings.value.filter(m => m.selected);
    const unselectedExisting = mappings.value.filter(m => !m.selected && m.isExisting);
    
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
        await client.graphql({
          query: mutations.deleteServiceExprMapping,
          variables: { input: { SERVICE_EXPR_MAPPING_ID: mapping.SERVICE_EXPR_MAPPING_ID } }
        });
      }
      
      await client.graphql({
        query: mutations.deleteServiceParamMapping,
        variables: { input: { SERVICE_PARAM_MAPPING_ID: mapping.SERVICE_PARAM_MAPPING_ID } }
      });
    }
    
    // Update or create selected mappings
    for (let i = 0; i < selectedMappings.length; i++) {
      const mapping = selectedMappings[i];
      currentProgress.value = unselectedExisting.length + i + 1;
      if (mapping.isExisting) {
        // Update existing
        const paramMappingInput = {
          SERVICE_PARAM_MAPPING_ID: mapping.SERVICE_PARAM_MAPPING_ID,
          ORIGIN_PRODUCT_ID: props.productId,
          SOURCE_SERVICE_PARAM_ID: mapping.SOURCE_SERVICE_PARAM_ID,
          TARGET_SERVICE_PARAM_ID: mapping.TARGET_SERVICE_PARAM_ID,
          SYSTEM_NBR: mapping.SYSTEM_NBR,
          PRIN_NBR: mapping.PRIN_NBR,
          AGENT_NBR: mapping.AGENT_NBR,
          MODIFIED_DATE: new Date().toISOString().split('T')[0]
        };
        
        await client.graphql({
          query: mutations.updateServiceParamMapping,
          variables: { input: paramMappingInput }
        });
        
        // Update or create expression mapping
        if (mapping.TARGET_EXPR || mapping.SOURCE_EXPR) {
          if (mapping.SERVICE_EXPR_MAPPING_ID) {
            const exprMappingInput = {
              SERVICE_EXPR_MAPPING_ID: mapping.SERVICE_EXPR_MAPPING_ID,
              SERVICE_PARAM_MAPPING_ID: mapping.SERVICE_PARAM_MAPPING_ID,
              SOURCE_EXPR: mapping.SOURCE_EXPR,
              TARGET_EXPR: mapping.TARGET_EXPR,
              MODIFIED_DATE: new Date().toISOString().split('T')[0]
            };
            
            await client.graphql({
              query: mutations.updateServiceExprMapping,
              variables: { input: exprMappingInput }
            });
          } else {
            const exprMappingInput = {
              SERVICE_PARAM_MAPPING_ID: mapping.SERVICE_PARAM_MAPPING_ID,
              SOURCE_EXPR: mapping.SOURCE_EXPR,
              TARGET_EXPR: mapping.TARGET_EXPR,
              CREATED_BY_USER_ID: 1,
              CREATED_DATE: new Date().toISOString().split('T')[0]
            };
            
            await client.graphql({
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
          const serviceParamInput = {
            SERVICE_ID: selectedTargetService.value.SERVICE_ID,
            PARAM_NAME: mapping.TARGET_PARAM_NAME,
            CREATED_BY_USER_ID: 1,
            CREATED_DATE: new Date().toISOString().split('T')[0]
          };
          
          const serviceParamResult = await client.graphql({
            query: mutations.createServiceParam,
            variables: { input: serviceParamInput }
          });
          
          targetServiceParamId = serviceParamResult.data.createSERVICE_PARAM.SERVICE_PARAM_ID;
        }
        
        // Check if source param exists, create if not
        if (mapping.SOURCE_PARAM_NAME && !sourceServiceParamId) {
          const existingSourceParam = sourceParams.value.find(sp => sp.PARAM_NAME === mapping.SOURCE_PARAM_NAME);
          if (existingSourceParam) {
            sourceServiceParamId = existingSourceParam.SERVICE_PARAM_ID;
          } else {
            // Create new source param
            const sourceParamInput = {
              SERVICE_ID: selectedSourceService.value.SERVICE_ID,
              PARAM_NAME: mapping.SOURCE_PARAM_NAME,
              CREATED_BY_USER_ID: 1,
              CREATED_DATE: new Date().toISOString().split('T')[0]
            };
            
            const sourceParamResult = await client.graphql({
              query: mutations.createServiceParam,
              variables: { input: sourceParamInput }
            });
            
            sourceServiceParamId = sourceParamResult.data.createSERVICE_PARAM.SERVICE_PARAM_ID;
          }
        }
        
        const paramMappingInput = {
          ORIGIN_PRODUCT_ID: props.productId,
          SOURCE_SERVICE_PARAM_ID: sourceServiceParamId,
          TARGET_SERVICE_PARAM_ID: targetServiceParamId,
          SYSTEM_NBR: mapping.SYSTEM_NBR,
          PRIN_NBR: mapping.PRIN_NBR,
          AGENT_NBR: mapping.AGENT_NBR,
          CREATED_BY_USER_ID: 1,
          CREATED_DATE: new Date().toISOString().split('T')[0]
        };
        
        const paramResult = await client.graphql({
          query: mutations.createServiceParamMapping,
          variables: { input: paramMappingInput }
        });
        
        if (mapping.TARGET_EXPR || mapping.SOURCE_EXPR) {
          const exprMappingInput = {
            SERVICE_PARAM_MAPPING_ID: paramResult.data.createSERVICE_PARAM_MAPPING.SERVICE_PARAM_MAPPING_ID,
            SOURCE_EXPR: mapping.SOURCE_EXPR,
            TARGET_EXPR: mapping.TARGET_EXPR,
            CREATED_BY_USER_ID: 1,
            CREATED_DATE: new Date().toISOString().split('T')[0]
          };
          
          await client.graphql({
            query: mutations.createServiceExprMapping,
            variables: { input: exprMappingInput }
          });
        }
      }
    }
    
    showProgressModal.value = false;
    successMessage.value = 'Mapping updated successfully!';
    showSuccessModal.value = true;
    await checkMappingExists();
  } catch (error) {
    showProgressModal.value = false;
    showError('Failed to update mapping');
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
    const result = await client.graphql({ query: queries.listServiceParamMappings });
    const mappingsToDelete = result.data.listSERVICE_PARAM_MAPPINGS.items.filter(mapping => 
      mapping.ORIGIN_PRODUCT_ID === props.productId &&
      sourceParams.value.some(sp => sp.SERVICE_PARAM_ID === mapping.SOURCE_SERVICE_PARAM_ID) &&
      mappings.value.some(tm => tm.TARGET_SERVICE_PARAM_ID === mapping.TARGET_SERVICE_PARAM_ID)
    );
    
    // Delete expression mappings first
    const exprResult = await client.graphql({ query: queries.listServiceExprMappings });
    const expressionsToDelete = exprResult.data.listSERVICE_EXPR_MAPPINGS.items.filter(expr =>
      mappingsToDelete.some(m => m.SERVICE_PARAM_MAPPING_ID === expr.SERVICE_PARAM_MAPPING_ID)
    );
    
    for (const expr of expressionsToDelete) {
      await client.graphql({
        query: mutations.deleteServiceExprMapping,
        variables: { input: { SERVICE_EXPR_MAPPING_ID: expr.SERVICE_EXPR_MAPPING_ID } }
      });
    }
    
    // Delete param mappings
    for (const mapping of mappingsToDelete) {
      await client.graphql({
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
           (!filters.value.SOURCE_EXPR || mapping.SOURCE_EXPR.toLowerCase().includes(filters.value.SOURCE_EXPR.toLowerCase()));
  });
  
  if (sortField.value) {
    filtered.sort((a, b) => {
      const aVal = String(a[sortField.value] || '').toLowerCase();
      const bVal = String(b[sortField.value] || '').toLowerCase();
      const comparison = aVal.localeCompare(bVal);
      return sortDirection.value === 'asc' ? comparison : -comparison;
    });
  }
  
  filteredMappings.value = filtered;
};

const clearFilters = () => {
  filters.value = {
    TARGET_PARAM_NAME: '',
    TARGET_EXPR: '',
    SOURCE_PARAM_NAME: '',
    SOURCE_EXPR: ''
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

const showError = (message) => {
  errorMessage.value = message;
  showErrorModal.value = true;
};

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
  const newWidth = Math.max(50, resizeData.value.startWidth + diff);
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
    loadProductInfo(),
    loadResourceNames(),
    loadStepTypes(),
    loadAllServices()
  ]);
});
</script>

<style scoped>
.mapping-manager {
  width: 100%;
  height: 100%;
  padding: 20px;
  overflow: auto;
}

.top-section {
  display: block;
  margin-bottom: 20px;
}

.product-info {
  display: inline-block;
  vertical-align: top;
}

.form-controls {
  display: inline-block;
  vertical-align: top;
  margin-left: 20px;
}

.product-info {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 5px;
  flex: 1;
  min-width: 300px;
}

.form-controls {
  display: flex;
  flex-direction: column;
  gap: 15px;
  width: 250px;
}

@media (max-width: 768px) {
  .top-section {
    flex-direction: column;
  }
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
  border: 1px solid #ccc;
  border-radius: 4px;
}

.action-buttons {
  margin-bottom: 20px;
}

.action-buttons button {
  margin-right: 10px;
}

.mapping-table-section {
  overflow: auto;
}

.mapping-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
}

.mapping-table th,
.mapping-table td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

.mapping-table th {
  background-color: #f2f2f2;
  position: sticky;
  top: 0;
}

.filter-row th {
  background-color: #e9ecef;
  padding: 4px;
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

.expr-input,
.param-select,
.param-input,
.nbr-input {
  width: 100%;
  padding: 4px;
  border: 1px solid #ccc;
  border-radius: 3px;
}

.sortable {
  cursor: pointer;
  user-select: none;
}

.sortable:hover {
  background-color: #e9ecef;
}

.sort-indicator {
  margin-left: 5px;
  font-weight: bold;
}

.w-12 {
  width: 3rem;
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

.nbr-column {
  width: 80px;
  min-width: 60px;
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
  background: white;
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
</style>