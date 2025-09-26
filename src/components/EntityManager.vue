<template>
  <div class="entity-manager">

    

    
    <!-- Service Filter for SERVICE_PARAM -->
    <div v-if="entityName === 'SERVICE_PARAM' && !hideFilters" class="filter-section">
      <label for="serviceFilter">Filter by Service:</label>
      <select id="serviceFilter" v-model="selectedServiceFilter" @change="filterByService">
        <option value="">-- Select a Service --</option>
        <option v-for="service in serviceOptions" :key="service.value" :value="service.value">
          {{ service.label }}
        </option>
      </select>
    </div>
    

    
    <!-- Action Buttons -->
    <div v-if="!hideActionButtons" class="fixed-action-buttons">
      <div class="action-buttons">
        <button @click="loadEntities" class="btn-primary">Refresh</button>
        <button @click="showCreateModal = true" class="btn-success" :disabled="props.readonly">{{ props.readonly ? 'View Only Mode' : 'Add New' }}</button>
        <button @click="confirmBulkDelete" :disabled="selectedEntities.length === 0 || !canDelete" class="btn-danger">Delete Selected ({{ selectedEntities.length }})</button>
        <span class="record-count">{{ entities.length }} records</span>
      </div>
    </div>
    
    <!-- Entity List -->
    <div class="entity-list">
      <LoadingSkeleton v-if="loading" :rows="5" :columns="fields.length + 2" />
      <div v-else-if="entities.length > 0" class="table-container">
        <table class="entity-table">
          <thead>
            <tr>
              <th class="w-12">
                <input 
                  type="checkbox" 
                  @change="toggleSelectAll" 
                  :checked="allSelected"
                  :aria-label="`Select all ${entityName} records`"
                />
              </th>
              <th v-for="field in fields" :key="field" class="resizable sortable" :data-field="field" @click="sortBy(field)">
                {{ field }}
                <span v-if="sortField === field" class="sort-indicator">
                  {{ sortDirection === 'asc' ? '↑' : '↓' }}
                </span>
                <div class="resize-handle" @mousedown="startResize($event, field)"></div>
              </th>
              <th>Actions</th>
            </tr>
            <tr class="filter-row">
              <th></th>
              <th v-for="field in fields" :key="`filter-${field}`">
                <input 
                  v-model="filters[field]" 
                  @input="applyFilters"
                  :placeholder="`Filter ${field}`"
                  class="filter-input"
                  :aria-label="`Filter by ${field}`"
                />
              </th>
              <th>
                <button @click="clearFilters" class="clear-filters-btn">Clear</button>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(entity, index) in displayEntities" :key="entity.__isBlank ? `blank-${index}` : getEntityId(entity)" :class="getRowClass(entity)">
              <td class="text-center">
                <input 
                  v-if="!entity.__isBlank"
                  type="checkbox" 
                  :value="getEntityId(entity)" 
                  v-model="selectedEntities"
                  :aria-label="`Select ${entityName} record ${getEntityId(entity)}`"
                />
              </td>
              <td v-for="field in fields" :key="field" :class="getCellClass(entity, field)">
                <span v-if="!entity.__isBlank" class="read-only-text">
                  {{ field.includes('DATE') ? formatDate(entity[field]) : 
                     (field === 'SERVICE_ID' && props.entityName === 'SERVICE_PARAM' && entity.SERVICE_DISPLAY) ? 
                     entity.SERVICE_DISPLAY : entity[field] }}
                </span>
                <span v-else class="blank-cell">—</span>
              </td>
              <td>
                <button v-if="!entity.__isBlank" @click="editEntity(entity)" :aria-label="`Edit ${entityName} ${getEntityId(entity)}`" class="btn-primary">
                  {{ props.readonly ? 'View' : (props.entityName === 'SERVICE_PARAM' && paramMappings.get(getEntityId(entity)) > 0) ? 'Copy & Edit' : 'Edit' }}
                </button>
                <button v-if="!entity.__isBlank && !props.hideRowActions && props.entityName === 'SERVICE_PARAM' && paramMappings.get(getEntityId(entity)) > 0" @click="showParameterMappings(entity)" class="btn-primary" style="margin-left: 5px;">Mappings ({{ paramMappings.get(getEntityId(entity)) }})</button>
                <button v-if="!entity.__isBlank && !props.hideRowActions && props.entityName === 'ORIGIN_PRODUCT'" @click="openMapping(entity)" class="btn-primary" style="margin-left: 5px;">Mapping</button>
                <button v-if="!entity.__isBlank && !props.hideRowActions && props.entityName === 'ORIGIN_PRODUCT'" @click="openRedirectUrls(entity)" class="btn-primary" style="margin-left: 5px;">Redirect URLs</button>
                <button v-if="!entity.__isBlank && !props.hideRowActions && props.entityName === 'STEP_TYPE'" @click="openStepServices(entity)" class="btn-primary" style="margin-left: 5px;">Edit Services</button>
                <button v-if="!entity.__isBlank && !props.hideRowActions && props.entityName === 'SERVICE'" @click="openServiceParams(entity)" class="btn-primary" style="margin-left: 5px;">Parameters</button>
                <button v-if="!entity.__isBlank && !props.hideRowActions && props.entityName === 'SERVICE'" @click="openServiceStepMapping(entity)" class="btn-primary" style="margin-left: 5px;">Step Mappings</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-else-if="!loading">No {{ entityName }} records found.</p>
    </div>
    
    <!-- Create Modal -->
    <div v-if="showCreateModal" class="modal-overlay">
      <div class="modal-content">
        <h3>Create {{ entityName }}</h3>
        <form @submit.prevent="submitForm">
          <div v-for="field in formFields" :key="field.name" class="form-group">
            <label :for="field.name">{{ field.name }}</label>
            <div v-if="field.name === 'VENDOR_NAME' && props.entityName === 'ORIGIN_PRODUCT'">
              <input 
                :id="field.name" 
                v-model="formData[field.name]" 
                type="text"
                :required="field.required"
                :disabled="field.disabled"
                list="vendor-names-create"
                placeholder="Select or enter vendor name"
              />
              <datalist id="vendor-names-create">
                <option v-for="vendor in vendorNames" :key="vendor" :value="vendor">
                  {{ vendor }}
                </option>
              </datalist>
            </div>
            <select 
              v-else-if="field.type === 'select'"
              :id="field.name" 
              v-model="formData[field.name]" 
              :required="field.required"
              :disabled="field.disabled || (field.name === 'SERVICE_ID' && props.entityName === 'SERVICE_PARAM' && selectedServiceFilter)"
            >
              <option value="">-- Select {{ field.name }} --</option>
              <option v-for="option in field.options" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
            <input 
              v-else
              :id="field.name" 
              v-model="formData[field.name]" 
              :type="field.name.includes('DATE') ? 'date' : field.type" 
              :required="field.required"
              :disabled="field.disabled || field.name === 'CREATED_DATE' || field.name === 'CHANGED_DATE'"
            />
          </div>

          <div class="form-actions">
            <button type="submit" class="btn-success">Create</button>
            <button type="button" @click="cancelForm" class="btn-primary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
    
    <!-- Edit Modal -->
    <div v-if="showEditModal" class="modal-overlay">
      <div class="modal-content">
        <h3>Edit {{ entityName }}</h3>
        <form @submit.prevent="submitForm">
          <div v-for="field in formFields" :key="field.name" class="form-group" v-show="!(getEntityConfig(props.entityName).hasAuditFields && (field.name === 'CREATED_DATE' || field.name === 'CREATED_BY_USER_ID'))">
            <label :for="field.name">{{ field.name }}</label>
            <div v-if="field.name === 'VENDOR_NAME' && props.entityName === 'ORIGIN_PRODUCT'">
              <input 
                :id="field.name" 
                v-model="formData[field.name]" 
                type="text"
                :required="field.required"
                :disabled="field.disabled"
                list="vendor-names-edit"
                placeholder="Select or enter vendor name"
              />
              <datalist id="vendor-names-edit">
                <option v-for="vendor in vendorNames" :key="vendor" :value="vendor">
                  {{ vendor }}
                </option>
              </datalist>
            </div>
            <select 
              v-else-if="field.type === 'select'"
              :id="field.name" 
              v-model="formData[field.name]" 
              :required="field.required"
              :disabled="field.disabled || (field.name === 'SERVICE_ID' && props.entityName === 'SERVICE_PARAM' && selectedServiceFilter)"
            >
              <option value="">-- Select {{ field.name }} --</option>
              <option v-for="option in field.options" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
            <input 
              v-else
              :id="field.name" 
              v-model="formData[field.name]" 
              :type="field.name.includes('DATE') ? 'date' : field.type" 
              :required="field.required"
              :disabled="field.disabled || field.name === 'CREATED_DATE' || field.name === 'CHANGED_DATE'"
            />
          </div>
          <!-- Show CHANGED fields for entities with modify audit fields -->
          <div v-if="getEntityConfig(props.entityName).hasChangedFields" class="form-group">
            <label for="CHANGED_DATE">CHANGED_DATE</label>
            <input 
              id="CHANGED_DATE" 
              v-model="formData.CHANGED_DATE" 
              type="date"
              disabled
            />
          </div>
          <div v-if="getEntityConfig(props.entityName).hasChangedFields" class="form-group">
            <label for="CHANGED_BY_USER_ID">CHANGED_BY_USER_ID</label>
            <input 
              id="CHANGED_BY_USER_ID" 
              v-model="formData.CHANGED_BY_USER_ID" 
              type="number"
            />
          </div>
          <div class="form-actions">
            <button type="submit" :disabled="props.readonly" class="btn-success">{{ props.readonly ? 'View Only' : (props.entityName === 'SERVICE_PARAM' && paramMappings.get(formData.SERVICE_PARAM_ID) > 0) ? 'Create Copy' : 'Update' }}</button>
            <button type="button" @click="cancelForm" class="btn-primary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
    
    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay">
      <div class="modal-content">
        <h3>Confirm Delete</h3>
        <p v-if="!isDeleting">Are you sure you want to delete {{ selectedEntities.length }} record(s)?</p>
        <p v-if="isDeleting">Now deleting {{ deleteProgress.current }} of {{ deleteProgress.total }} records</p>
        <div class="form-actions">
          <button @click="deleteBulkEntities" class="btn-danger" :disabled="isDeleting">{{ isDeleting ? 'Deleting...' : 'Yes, Delete' }}</button>
          <button @click="showDeleteModal = false" :disabled="isDeleting" class="btn-primary">Cancel</button>
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
    
    <!-- Parameter Mappings Modal -->
    <div v-if="showMappingsModal" class="modal-overlay">
      <div class="modal-content mappings-modal">
        <h3>Mappings for Parameter: {{ selectedParamName }}</h3>
        <div v-if="selectedParamMappings.length > 0" class="table-container">
          <table class="entity-table">
            <thead>
              <tr>
                <th>Mapping ID</th>
                <th>PSCU Client ID</th>
                <th>Product ID</th>
                <th>Source Service</th>
                <th>Target Service</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="mapping in selectedParamMappings" :key="mapping.SERVICE_PARAM_MAPPING_ID">
                <td>{{ mapping.SERVICE_PARAM_MAPPING_ID }}</td>
                <td>{{ mapping.PSCU_CLIENT_ID }}</td>
                <td>{{ mapping.PRODUCT_ID }}</td>
                <td>{{ mapping.SOURCE_SERVICE }}</td>
                <td>{{ mapping.TARGET_SERVICE }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-else>No mappings found for this parameter.</p>
        <div class="form-actions">
          <button @click="showMappingsModal = false" class="btn-primary">Close</button>
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
  </div>
</template>

<script setup lang="ts">
import '../styles/shared.css';
import { ref, computed, onMounted, onUnmounted, defineProps, watch } from 'vue';
import { getClient, getUserPoolClient } from '../client.js';
import { listServiceParams } from '../graphql/queries.js';
import * as queries from '../graphql/queries.js';
import LoadingSkeleton from './LoadingSkeleton.vue';
import { useErrorHandler } from '../composables/useErrorHandler';
import { useTableOperations } from '../composables/useTableOperations';
import { useServiceEnhancement } from '../composables/useServiceEnhancement';
import { useAuth } from '../composables/useAuth';
import { getCurrentDateString, formatDate } from '../utils/dateUtils';
import { getEntityConfig } from '../config/entityConfig';
import type { FormField } from '../types';

const props = defineProps({
  entityName: {
    type: String,
    required: true
  },
  fields: {
    type: Array,
    required: true
  },
  formFields: {
    type: Array,
    required: true
  },
  idField: {
    type: String,
    required: true
  },
  loadFunction: {
    type: Function,
    required: true
  },
  createFunction: {
    type: Function,
    required: true
  },
  updateFunction: {
    type: Function,
    required: true
  },
  deleteFunction: {
    type: Function,
    required: true
  },
  hideFilters: {
    type: Boolean,
    default: false
  },
  parentId: {
    type: [Number, String],
    default: null
  },
  parentField: {
    type: String,
    default: null
  },
  readonly: {
    type: Boolean,
    default: false
  },
  canDelete: {
    type: Boolean,
    default: true
  },
  hideActionButtons: {
    type: Boolean,
    default: false
  },
  hideRowActions: {
    type: Boolean,
    default: false
  },
  fieldDifferences: {
    type: Map,
    default: () => new Map()
  },
  comparisonMode: {
    type: String,
    default: null
  },
  matchedPairs: {
    type: Array,
    default: () => []
  },
  unmatchedRecords: {
    type: Array,
    default: () => []
  },
  primaryData: {
    type: Array,
    default: () => []
  },
  syncFilters: {
    type: Object,
    default: () => ({})
  },
  syncSort: {
    type: Object,
    default: () => ({ field: '', direction: 'asc' })
  }
});

const entities = ref([]);
const filteredEntities = ref([]);
const filters = ref({});
const formData = ref({});
const showCreateModal = ref(false);
const showEditModal = ref(false);
const showDeleteModal = ref(false);
const paramMappings = ref(new Map());
const showMappingsModal = ref(false);
const selectedParamMappings = ref([]);
const selectedParamName = ref('');
const { error: errorMessage, showErrorModal, handleError, handleGraphQLError, clearError } = useErrorHandler();
const { enhanceServiceParams, loadServiceOptions } = useServiceEnhancement();
const { canDelete } = useAuth();
const showSuccessModal = ref(false);
const successMessage = ref('');

const getEntityId = (entity) => {
  return entity[props.idField];
};

const { selectedItems: selectedEntities, toggleSelectAll: toggleSelectAllItems, sortBy: sortByField, applyFilters: applyTableFilters } = useTableOperations(entities, getEntityId);

// Watch selectedEntities and emit count changes
watch(selectedEntities, (newVal) => {
  emit('selectedCountChanged', newVal.length);
}, { deep: true });

// Watch entities and emit count changes
watch(entities, (newVal) => {
  emit('entityCountChanged', newVal.length);
}, { deep: true });

const allSelected = computed(() => 
  filteredEntities.value.length > 0 && selectedEntities.value.length === filteredEntities.value.length
);
const isResizing = ref(false);
const resizeData = ref({ field: '', startX: 0, startWidth: 0 });
const isDeleting = ref(false);
const deleteProgress = ref({ current: 0, total: 0 });
const sortField = ref('');
const sortDirection = ref('asc');
const selectedServiceFilter = ref('');
const selectedStepFilter = ref('');
const serviceOptions = ref([]);
const stepTypeOptions = ref([]);
const allEntities = ref([]);
const vendorNames = ref([]);
const loading = ref(false);



const loadEntities = async () => {
  // For SERVICE_PARAM, don't load anything until service is selected (unless parentId is provided)
  if (props.entityName === 'SERVICE_PARAM' && !selectedServiceFilter.value && !props.parentId) {
    allEntities.value = [];
    entities.value = [];
    filteredEntities.value = [];
    return;
  }
  

  

  
  try {
    let allItems = [];
    const listName = `list${props.entityName}S`;
    
    const response = await props.loadFunction({ limit: 1000 });
    
    if (response.data && response.data[listName]) {
      allItems = response.data[listName].items || [];
      
      // Filter by parent ID if provided
      if (props.parentId && props.parentField) {
        allItems = allItems.filter(item => item[props.parentField] === props.parentId);
      }
    }
    
    // Enhance SERVICE_PARAM entities with display format
    if (props.entityName === 'SERVICE_PARAM') {
      allItems = await enhanceServiceParams(allItems);
      await checkParameterMappings();
    }
    
    allEntities.value = allItems;
    entities.value = allItems;
    filteredEntities.value = allItems;
  } catch (error) {
    handleError(error, `loading ${props.entityName}`);
    allEntities.value = [];
    entities.value = [];
    filteredEntities.value = [];
  }
};

const editEntity = (entity) => {
  if (props.readonly) {
    // For readonly users, just show the modal in view mode
    const formattedEntity = { ...entity };
    Object.keys(formattedEntity).forEach(key => {
      if (key.includes('DATE') && formattedEntity[key]) {
        formattedEntity[key] = formatDate(formattedEntity[key]);
      }
    });
    formData.value = formattedEntity;
    showEditModal.value = true;
    return;
  }
  
  const formattedEntity = { ...entity };
  // Format date fields for form display
  Object.keys(formattedEntity).forEach(key => {
    if (key.includes('DATE') && formattedEntity[key]) {
      formattedEntity[key] = formatDate(formattedEntity[key]);
    }
  });
  
  // Set current date and user ID for modifications
  const entityConfig = getEntityConfig(props.entityName);
  if (entityConfig.hasChangedFields) {
    formattedEntity.CHANGED_DATE = getCurrentDateString();
    formattedEntity.CHANGED_BY_USER_ID = 1;
  }
  
  formData.value = formattedEntity;
  showEditModal.value = true;
};

const emit = defineEmits(['openMapping', 'openRedirectUrls', 'openStepServices', 'openServiceParams', 'openServiceStepMapping', 'entityCountChanged', 'selectedCountChanged', 'filterChanged', 'sortChanged']);

const openMapping = (entity) => {
  emit('openMapping', { productId: entity.ORIGIN_PRODUCT_ID });
};

const openRedirectUrls = (entity) => {
  emit('openRedirectUrls', { productId: entity.ORIGIN_PRODUCT_ID });
};

const openStepServices = (entity) => {
  emit('openStepServices', { stepTypeId: entity.STEP_TYPE_ID });
};

const openServiceParams = (entity) => {
  emit('openServiceParams', { serviceId: entity.SERVICE_ID });
};

const openServiceStepMapping = (entity) => {
  emit('openServiceStepMapping', { serviceId: entity.SERVICE_ID });
};

const confirmBulkDelete = () => {
  if (selectedEntities.value.length > 0) {
    // For SERVICE_PARAM, check if any selected params have mappings
    if (props.entityName === 'SERVICE_PARAM') {
      const paramsWithMappings = selectedEntities.value.filter(id => 
        paramMappings.value.get(id) > 0
      );
      
      if (paramsWithMappings.length > 0) {
        handleError({ message: `Cannot delete ${paramsWithMappings.length} parameter(s) that have existing mappings` }, 'deletion');
        return;
      }
    }
    showDeleteModal.value = true;
  }
};

const deleteBulkEntities = async () => {
  try {
    isDeleting.value = true;
    deleteProgress.value.total = selectedEntities.value.length;
    deleteProgress.value.current = 0;
    
    for (let i = 0; i < selectedEntities.value.length; i++) {
      deleteProgress.value.current = i + 1;
      const entityId = selectedEntities.value[i];
      const input = { [props.idField]: entityId };
      await props.deleteFunction(input);
      // Small delay to show progress updates
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    showDeleteModal.value = false;
    selectedEntities.value = [];
    allSelected.value = false;
    isDeleting.value = false;
    await loadEntities();
  } catch (error) {
    handleError(error, `deleting ${props.entityName}`);
  } finally {
    isDeleting.value = false;
    showDeleteModal.value = false;
  }
};

const toggleSelectAll = () => {
  toggleSelectAllItems();
};

// Set current date in YYYY-MM-DD format for CREATED_DATE when creating a new entity
watch(showCreateModal, (newVal) => {
  if (newVal) {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const currentDate = `${year}-${month}-${day}`;
    
    formData.value = {
      ...formData.value,
      CREATED_DATE: currentDate
    };
    
    // Set parent ID if provided
    if (props.parentId && props.parentField) {
      formData.value[props.parentField] = props.parentId;
    }
    
    // Set SERVICE_ID from filter for SERVICE_PARAM
    if (props.entityName === 'SERVICE_PARAM' && selectedServiceFilter.value) {
      formData.value.SERVICE_ID = parseInt(selectedServiceFilter.value);
    }
    
    // Set CREATED_BY_USER_ID to 1 for entities with audit fields
    const entityConfig = getEntityConfig(props.entityName);
    if (entityConfig.hasAuditFields) {
      formData.value.CREATED_BY_USER_ID = 1;
    }
  }
});



const submitForm = async () => {
  // Prevent submission for readonly users
  if (props.readonly && showEditModal.value) {
    return;
  }
  
  try {
    const currentDate = getCurrentDateString();
    const entityConfig = getEntityConfig(props.entityName);
    const skipDateFields = entityConfig.skipDateFields;
    
    // Clean form data for specific entities
    let cleanedFormData = { ...formData.value };
    
    // Convert number fields to integers for all entities
    props.formFields.forEach(field => {
      if (field.type === 'number' && cleanedFormData[field.name] !== undefined && cleanedFormData[field.name] !== '') {
        const converted = parseInt(cleanedFormData[field.name]);
        if (!isNaN(converted)) {
          cleanedFormData[field.name] = converted;
        }
      }
    });
    
    // Ensure CREATED_BY_USER_ID is always an integer
    if (cleanedFormData.CREATED_BY_USER_ID !== undefined) {
      cleanedFormData.CREATED_BY_USER_ID = parseInt(cleanedFormData.CREATED_BY_USER_ID) || 1;
    }
    
    // Ensure PSCU_CLIENT_ID is always an integer for ORIGIN_PRODUCT
    if (props.entityName === 'ORIGIN_PRODUCT' && cleanedFormData.PSCU_CLIENT_ID !== undefined) {
      cleanedFormData.PSCU_CLIENT_ID = parseInt(cleanedFormData.PSCU_CLIENT_ID);
    }
    
    if (props.entityName === 'STEP_SERVICE_MAPPING') {
      // Only keep supported fields with proper types
      cleanedFormData = {};
      if (formData.value.STEP_TYPE_ID) {
        cleanedFormData.STEP_TYPE_ID = parseInt(formData.value.STEP_TYPE_ID);
      }
      if (formData.value.SERVICE_ID) {
        cleanedFormData.SERVICE_ID = parseInt(formData.value.SERVICE_ID);
      }
      if (formData.value.SEQUENCE_NBR) {
        cleanedFormData.SEQUENCE_NBR = parseInt(formData.value.SEQUENCE_NBR);
      }
    }
    
    // Remove display fields that shouldn't be sent to GraphQL
    if (cleanedFormData.SERVICE_DISPLAY) {
      delete cleanedFormData.SERVICE_DISPLAY;
    }
    if (cleanedFormData['Service Provider']) {
      delete cleanedFormData['Service Provider'];
    }
    
    // Determine if this is create or update based on presence of ID field
    const isUpdate = cleanedFormData[props.idField] !== undefined && cleanedFormData[props.idField] !== null;
    
    // Filter fields based on create vs update operation
    if (isUpdate) {
      // For updates, remove CREATED fields that aren't allowed in update input
      delete cleanedFormData.CREATED_BY_USER_ID;
      delete cleanedFormData.CREATED_DATE;
    } else {
      // For creates, remove ID and CHANGED fields that aren't allowed in create input
      delete cleanedFormData[props.idField];
      delete cleanedFormData.CHANGED_BY_USER_ID;
      delete cleanedFormData.CHANGED_DATE;
    }
    
    console.log('Submitting form data AFTER filtering:', cleanedFormData);
    console.log('isUpdate:', isUpdate, 'showEditModal:', showEditModal.value);
    
    if (isUpdate) {
      // For SERVICE_PARAM with mappings, create new instead of update
      if (props.entityName === 'SERVICE_PARAM' && paramMappings.value.get(cleanedFormData.SERVICE_PARAM_ID) > 0) {
        // Remove ID and CHANGED fields to create new parameter
        delete cleanedFormData.SERVICE_PARAM_ID;
        delete cleanedFormData.CHANGED_BY_USER_ID;
        delete cleanedFormData.CHANGED_DATE;
        if (!skipDateFields) {
          cleanedFormData.CREATED_DATE = currentDate;
          cleanedFormData.CREATED_BY_USER_ID = 1;
        }
        await props.createFunction(cleanedFormData);
        successMessage.value = `New ${props.entityName} created (original has mappings)!`;
        showSuccessModal.value = true;
      } else {
        // Set audit fields for updates
        if (!skipDateFields) {
          cleanedFormData.CHANGED_DATE = currentDate;
        }
        const client = getClient();
        await props.updateFunction(cleanedFormData);
        successMessage.value = `${props.entityName} updated successfully!`;
        showSuccessModal.value = true;
      }
    } else {
      // Set audit fields for new records
      if (!skipDateFields && !cleanedFormData.CREATED_DATE) {
        cleanedFormData.CREATED_DATE = currentDate;
      }
      await props.createFunction(cleanedFormData);
      successMessage.value = `${props.entityName} created successfully!`;
      showSuccessModal.value = true;
    }
    cancelForm();
    await loadEntities();
  } catch (error) {
    console.error(`Error saving ${props.entityName}:`, error);
    console.error('Full error object:', JSON.stringify(error, null, 2));
    
    // Check if record was actually created despite the error
    const hasData = error.data && Object.keys(error.data).length > 0;
    const isTemplateError = error.errors && error.errors.some(e => 
      e.message && e.message.includes('Template missing required SQL statement')
    );
    
    if (hasData && isTemplateError) {
      // Record was created successfully despite template error
      cancelForm();
      await loadEntities();
      return;
    }
    
    let errorMsg = error.message || `Failed to save ${props.entityName} record`;
    
    // Extract GraphQL error details
    if (error.errors && error.errors.length > 0) {
      console.error('GraphQL errors:', error.errors);
      errorMsg = error.errors.map(e => e.message).join('\n');
    }
    
    handleError({ message: errorMsg }, `saving ${props.entityName}`);
  } finally {
    // Ensure modals are closed and buttons re-enabled even on error
    showCreateModal.value = false;
    showEditModal.value = false;
  }
};

const cancelForm = () => {
  formData.value = {};
  showCreateModal.value = false;
  showEditModal.value = false;
};

const applyFilters = () => {
  let filtered = entities.value.filter(entity => {
    return props.fields.every(field => {
      const filterValue = filters.value[field];
      if (!filterValue) return true;
      const entityValue = String(entity[field] || '').toLowerCase();
      return entityValue.includes(filterValue.toLowerCase());
    });
  });
  
  // Apply sorting
  if (sortField.value) {
    filtered.sort((a, b) => {
      const aVal = String(a[sortField.value] || '').toLowerCase();
      const bVal = String(b[sortField.value] || '').toLowerCase();
      const comparison = aVal.localeCompare(bVal);
      return sortDirection.value === 'asc' ? comparison : -comparison;
    });
  }
  
  filteredEntities.value = filtered;
  
  // Emit changes for synchronization (only from primary table)
  if (props.comparisonMode === 'primary') {
    emit('filterChanged', { type: 'filter', filters: filters.value });
  }
};

const clearFilters = () => {
  filters.value = {};
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
  
  // Emit sort changes for synchronization (only from primary table)
  if (props.comparisonMode === 'primary') {
    emit('sortChanged', { type: 'sort', field: sortField.value, direction: sortDirection.value });
  }
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

const filterByStepType = async () => {
  if (props.entityName !== 'STEP_SERVICE_MAPPING') return;
  
  if (selectedStepFilter.value) {
    try {
      const [mappingsResult, stepTypesResult, servicesResult] = await Promise.all([
        getClient().graphql({
          query: queries.listStepServiceMappings,
          variables: {
            filter: { STEP_TYPE_ID: { eq: parseInt(selectedStepFilter.value) } },
            limit: 1000
          }
        }),
        getClient().graphql({ query: queries.listStepTypes }),
        getClient().graphql({ query: queries.listServices })
      ]);
      
      const mappings = mappingsResult.data.listSTEP_SERVICE_MAPPINGS?.items || [];
      const stepTypes = stepTypesResult.data.listSTEP_TYPES?.items || [];
      const services = servicesResult.data.listSERVICES?.items || [];
      
      // Add formatted display fields
      const enhancedMappings = mappings.map(mapping => {
        const stepType = stepTypes.find(st => st.STEP_TYPE_ID === mapping.STEP_TYPE_ID);
        const service = services.find(s => s.SERVICE_ID === mapping.SERVICE_ID);
        return {
          ...mapping,
          'STEP_TYPE': stepType ? `${stepType.STEP_TYPE_ID}: ${stepType.STEP_TYPE_NAME}` : mapping.STEP_TYPE_ID,
          'SERVICE': service ? `${service.SERVICE_ID}: ${service.URI}` : mapping.SERVICE_ID
        };
      });
      
      allEntities.value = enhancedMappings;
      entities.value = enhancedMappings;
      filteredEntities.value = enhancedMappings;
    } catch (error) {
      console.error('Error loading step service mappings:', error);
      entities.value = [];
      filteredEntities.value = [];
    }
  } else {
    allEntities.value = [];
    entities.value = [];
    filteredEntities.value = [];
  }
  
  applyFilters();
};

const filterByService = async () => {
  if (props.entityName !== 'SERVICE_PARAM') return;
  
  if (selectedServiceFilter.value) {
    try {
      let allItems = [];
      let nextToken = null;
      
      do {
        const variables = {
          filter: { SERVICE_ID: { eq: parseInt(selectedServiceFilter.value) } },
          limit: 1000
        };
        if (nextToken) {
          variables.nextToken = nextToken;
        }
        
        const response = await getClient().graphql({
          query: listServiceParams,
          variables
        });
        
        if (response.data?.listSERVICE_PARAMS) {
          const items = response.data.listSERVICE_PARAMS.items || [];
          allItems.push(...items);
          nextToken = response.data.listSERVICE_PARAMS.nextToken;
        } else {
          nextToken = null;
        }
      } while (nextToken);
      
      // Enhance with service display format
      const enhancedItems = await enhanceServiceParams(allItems);
      await checkParameterMappings();
      
      allEntities.value = enhancedItems;
      entities.value = enhancedItems;
      filteredEntities.value = enhancedItems;
    } catch (error) {
      console.error('Error loading service parameters:', error);
      entities.value = [];
      filteredEntities.value = [];
    }
  } else {
    allEntities.value = [];
    entities.value = [];
    filteredEntities.value = [];
  }
  
  applyFilters();
};

// Watch for entityName changes and reload data
watch(() => props.entityName, async () => {
  filters.value = {};
  selectedEntities.value = [];
  allSelected.value = false;
  sortField.value = '';
  sortDirection.value = 'asc';
  
  // Load service options for SERVICE_PARAM entity
  if (props.entityName === 'SERVICE_PARAM') {
    await loadServiceOptionsLocal();
  }
  
  // Load service provider options for SERVICE entity
  if (props.entityName === 'SERVICE') {
    await loadServiceProviderOptions();
  }
  
  // Load step and service options for STEP_SERVICE_MAPPING entity
  if (props.entityName === 'STEP_SERVICE_MAPPING') {
    await loadStepServiceMappingOptions();
  }
  
  // Load vendor names for ORIGIN_PRODUCT entity
  if (props.entityName === 'ORIGIN_PRODUCT') {
    await loadVendorNames();
  }
  

  
  loadEntities();
});

const handleEscapeKey = (event) => {
  if (event.key === 'Escape') {
    if (showCreateModal.value) {
      showCreateModal.value = false;
      formData.value = {};
    } else if (showEditModal.value) {
      showEditModal.value = false;
      formData.value = {};
    } else if (showDeleteModal.value && !isDeleting.value) {
      showDeleteModal.value = false;
    }
  }
};

const loadServiceOptionsLocal = async () => {
  try {
    const options = await loadServiceOptions();
    serviceOptions.value = options;
    
    // Update the SERVICE_ID field options for forms
    const serviceIdField = props.formFields.find(f => f.name === 'SERVICE_ID');
    if (serviceIdField) {
      serviceIdField.options = options;
    }
  } catch (error) {
    console.error('Error loading service options:', error);
  }
};

const loadServiceProviderOptions = async () => {
  try {
    const { callExternalApi } = await import('../client.js');
    const environment = localStorage.getItem('selectedEnvironment') || 'dev';
    const result = await callExternalApi(environment, 'listSERVICE_PROVIDERS');
    const providers = result.data.listSERVICE_PROVIDERS.items || [];
    
    // Update the SERVICE_PROVIDER_ID field options
    const providerIdField = props.formFields.find(f => f.name === 'SERVICE_PROVIDER_ID');
    if (providerIdField && Array.isArray(providers)) {
      providerIdField.options = providers.map(provider => ({
        value: provider.SERVICE_PROVIDER_ID,
        label: `${provider.SERVICE_PROVIDER_ID}: ${provider.SERVICE_PROVIDER_NAME}`
      }));
    }
  } catch (error) {
    console.error('Error loading service provider options:', error);
  }
};

const loadStepTypeFilterOptions = async () => {
  try {
    const result = await getClient().graphql({ query: queries.listStepTypes });
    const stepTypes = result.data.listSTEP_TYPES?.items || [];
    
    stepTypeOptions.value = stepTypes.map(step => ({
      value: step.STEP_TYPE_ID,
      label: `${step.STEP_TYPE_ID}: ${step.STEP_TYPE_NAME}`
    }));
  } catch (error) {
    console.error('Error loading step type options:', error);
    stepTypeOptions.value = [];
  }
};

const loadStepServiceMappingOptions = async () => {
  try {
    const [stepTypesResult, servicesResult, providersResult] = await Promise.all([
      getClient().graphql({ query: queries.listStepTypes }),
      getClient().graphql({ query: queries.listServices }),
      getClient().graphql({ query: queries.listServiceProviders })
    ]);
    
    const stepTypes = stepTypesResult.data.listSTEP_TYPES?.items || [];
    const services = servicesResult.data.listSERVICES?.items || [];
    const providers = providersResult.data.listSERVICE_PROVIDERS?.items || [];
    
    // Update STEP_TYPE_ID field options
    const stepTypeField = props.formFields.find(f => f.name === 'STEP_TYPE_ID');
    if (stepTypeField) {
      stepTypeField.options = stepTypes.map(step => ({
        value: step.STEP_TYPE_ID,
        label: `${step.STEP_TYPE_ID}: ${step.STEP_TYPE_NAME}`
      }));
    }
    
    // Update SERVICE_ID field options
    const serviceField = props.formFields.find(f => f.name === 'SERVICE_ID');
    if (serviceField) {
      serviceField.options = services.map(service => {
        const provider = providers.find(p => p.SERVICE_PROVIDER_ID === service.SERVICE_PROVIDER_ID);
        return {
          value: service.SERVICE_ID,
          label: `${service.SERVICE_ID}: ${service.URI} - ${provider?.SERVICE_PROVIDER_NAME || 'Unknown'}`
        };
      });
    }
  } catch (error) {
    console.error('Error loading step service mapping options:', error);
  }
};

const showParameterMappings = async (entity) => {
  try {
    const paramId = entity.SERVICE_PARAM_ID;
    selectedParamName.value = entity.PARAM_NAME;
    
    // Get all data with proper pagination
    let allServiceParams = [];
    let nextToken = null;
    do {
      const serviceParamsResult = await getClient().graphql({ 
        query: queries.listServiceParams,
        variables: { limit: 1000, nextToken }
      });
      const items = Array.isArray(serviceParamsResult.data.listSERVICE_PARAMS) ? serviceParamsResult.data.listSERVICE_PARAMS : [];
      allServiceParams.push(...items);
      nextToken = null; // Direct array response doesn't have pagination
    } while (nextToken);
    
    const [mappingsResult, productsResult, servicesResult] = await Promise.all([
      getClient().graphql({ query: queries.listServiceParamMappings }),
      getClient().graphql({ query: queries.listOriginProducts }),
      getClient().graphql({ query: queries.listServices })
    ]);
    
    const allMappings = mappingsResult.data.listSERVICE_PARAM_MAPPINGS?.items || [];
    const products = productsResult.data.listORIGIN_PRODUCTS?.items || [];
    const services = servicesResult.data.listSERVICES?.items || [];
    const serviceParams = allServiceParams;
    
    // Find mappings where this param is source or target
    const paramMappings = allMappings.filter(mapping => 
      mapping.SOURCE_SERVICE_PARAM_ID === paramId || mapping.TARGET_SERVICE_PARAM_ID === paramId
    );
    
    // Enhance mappings with product and service info
    const enhancedMappings = paramMappings.map(mapping => {
      const product = products.find(p => p.ORIGIN_PRODUCT_ID === mapping.ORIGIN_PRODUCT_ID);
      
      // Find source and target service params, then their services
      const sourceParam = serviceParams.find(sp => Number(sp.SERVICE_PARAM_ID) === Number(mapping.SOURCE_SERVICE_PARAM_ID));
      const targetParam = serviceParams.find(sp => Number(sp.SERVICE_PARAM_ID) === Number(mapping.TARGET_SERVICE_PARAM_ID));
      
      const sourceService = sourceParam ? services.find(s => Number(s.SERVICE_ID) === Number(sourceParam.SERVICE_ID)) : null;
      const targetService = targetParam ? services.find(s => Number(s.SERVICE_ID) === Number(targetParam.SERVICE_ID)) : null;
      
      return {
        SERVICE_PARAM_MAPPING_ID: mapping.SERVICE_PARAM_MAPPING_ID,
        PSCU_CLIENT_ID: product?.PSCU_CLIENT_ID || 'N/A',
        PRODUCT_ID: product?.PRODUCT_ID || 'N/A',
        SOURCE_SERVICE: sourceService?.URI || (sourceParam ? `Service ID: ${sourceParam.SERVICE_ID}` : 'N/A'),
        TARGET_SERVICE: targetService?.URI || (targetParam ? `Service ID: ${targetParam.SERVICE_ID}` : 'N/A')
      };
    });
    
    selectedParamMappings.value = enhancedMappings;
    showMappingsModal.value = true;
  } catch (error) {
    handleError(error, 'loading parameter mappings');
  }
};

const checkParameterMappings = async () => {
  if (props.entityName !== 'SERVICE_PARAM') return;
  
  try {
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
    console.error('Error checking parameter mappings:', error);
  }
};





const loadVendorNames = async () => {
  try {
    const response = await props.loadFunction({ limit: 1000 });
    const listName = `list${props.entityName}S`;
    
    if (response.data && response.data[listName]) {
      const items = Array.isArray(response.data[listName]) ? response.data[listName] : [];
      const uniqueVendors = [...new Set(
        items
          .map(item => item.VENDOR_NAME)
          .filter(name => name && name.trim())
      )].sort();
      
      vendorNames.value = uniqueVendors;
    }
  } catch (error) {
    console.error('Error loading vendor names:', error);
  }
};

// Listen for environment changes via custom event
const handleEnvironmentChange = async () => {
  // Reload dropdown options first
  if (props.entityName === 'SERVICE_PARAM') {
    await loadServiceOptionsLocal();
  }
  if (props.entityName === 'SERVICE') {
    await loadServiceProviderOptions();
  }
  if (props.entityName === 'STEP_SERVICE_MAPPING') {
    await loadStepServiceMappingOptions();
    await loadStepTypeFilterOptions();
  }
  if (props.entityName === 'ORIGIN_PRODUCT') {
    await loadVendorNames();
  }
  
  // Then reload entity data
  if (props.entityName !== 'SERVICE_PARAM' || selectedServiceFilter.value || props.parentId) {
    if (props.entityName !== 'STEP_SERVICE_MAPPING' || selectedStepFilter.value || props.parentId) {
      loadEntities();
    }
  }
};

window.addEventListener('environmentChanged', handleEnvironmentChange);

// Watch for sync changes from primary table
watch(() => props.syncFilters, (newFilters) => {
  if (props.comparisonMode === 'compare' && newFilters) {
    filters.value = { ...newFilters };
    applyFilters();
  }
}, { deep: true });

watch(() => props.syncSort, (newSort) => {
  if (props.comparisonMode === 'compare' && newSort.field) {
    sortField.value = newSort.field;
    sortDirection.value = newSort.direction;
    applyFilters();
  }
}, { deep: true });

onMounted(async () => {
  if (props.entityName === 'SERVICE_PARAM') {
    await loadServiceOptionsLocal();
  }
  if (props.entityName === 'SERVICE') {
    await loadServiceProviderOptions();
  }
  if (props.entityName === 'STEP_SERVICE_MAPPING') {
    await loadStepServiceMappingOptions();
    await loadStepTypeFilterOptions();
  }
  if (props.entityName === 'ORIGIN_PRODUCT') {
    await loadVendorNames();
  }

  loadEntities();
  document.addEventListener('keydown', handleEscapeKey);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscapeKey);
  window.removeEventListener('environmentChanged', handleEnvironmentChange);
});

const displayEntities = computed(() => {
  if (!props.comparisonMode) {
    return filteredEntities.value;
  }
  
  if (props.comparisonMode === 'primary') {
    // Primary table uses normal filtered entities
    return filteredEntities.value;
  } else {
    // Compare table reorders filtered entities to match primary
    const filtered = filteredEntities.value;
    const ordered = [];
    
    // Apply same filtering to primary data to get the filtered primary order
    const filteredPrimary = props.primaryData.filter(entity => {
      return props.fields.every(field => {
        const filterValue = filters.value[field];
        if (!filterValue) return true;
        const entityValue = String(entity[field] || '').toLowerCase();
        return entityValue.includes(filterValue.toLowerCase());
      });
    });
    
    // Apply same sorting to filtered primary data
    if (sortField.value) {
      filteredPrimary.sort((a, b) => {
        const aVal = String(a[sortField.value] || '').toLowerCase();
        const bVal = String(b[sortField.value] || '').toLowerCase();
        const comparison = aVal.localeCompare(bVal);
        return sortDirection.value === 'asc' ? comparison : -comparison;
      });
    }
    
    // Reorder compare entities to match filtered/sorted primary order
    filteredPrimary.forEach(primaryRecord => {
      const primaryId = primaryRecord[props.idField];
      const matchInfo = props.fieldDifferences.get(primaryId);
      
      if (matchInfo && filtered.includes(matchInfo.compareRecord)) {
        ordered.push(matchInfo.compareRecord);
      } else {
        ordered.push({ __isBlank: true });
      }
    });
    
    // Add any remaining filtered compare records that weren't matched
    filtered.forEach(compareRecord => {
      if (!ordered.includes(compareRecord)) {
        ordered.push(compareRecord);
      }
    });
    
    return ordered;
  }
});

const getRowClass = (entity) => {
  if (!props.comparisonMode || entity.__isBlank) return '';
  
  const entityId = getEntityId(entity);
  
  // Check if this entity is part of a matched pair
  const isMatched = props.matchedPairs.some(pair => {
    if (props.comparisonMode === 'primary') {
      return getEntityId(pair.primary) === entityId;
    } else {
      return getEntityId(pair.compare) === entityId;
    }
  });
  
  return isMatched ? '' : 'row-unmatched';
};

const getCellClass = (entity, field) => {
  if (!props.fieldDifferences || !props.comparisonMode) return '';
  
  const entityId = getEntityId(entity);
  const diffInfo = props.fieldDifferences.get(entityId);
  
  if (diffInfo && diffInfo.differentFields.includes(field)) {
    return 'field-different';
  }
  
  // Also check if this entity is the compare match for a primary record
  if (props.comparisonMode === 'compare') {
    for (const [primaryId, info] of props.fieldDifferences.entries()) {
      if (info.compareId === entityId && info.differentFields.includes(field)) {
        return 'field-different';
      }
    }
  }
  
  return '';
};

// Expose methods to parent component
defineExpose({
  loadEntities,
  showCreateModal,
  confirmBulkDelete
});
</script>

<style scoped>
.entity-manager {
  width: 100%;
  height: 100%;
  padding: 20px;
  overflow: auto;
  background-color: var(--bg-color);
  color: var(--text-color);
}

.table-container {
  max-height: 600px;
  overflow: auto;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background-color: var(--bg-color);
}

.entity-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
  table-layout: fixed;
}

.entity-table th,
.entity-table td {
  border: 1px solid var(--border-color);
  padding: 8px;
  text-align: left;
  background-color: var(--bg-color);
  color: var(--text-color);
  height: 45px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.entity-table th {
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

.w-12 {
  width: 3%;
}

.text-center {
  text-align: center;
}

.form-group {
  margin-bottom: 10px;
}

label {
  display: block;
  margin-bottom: 5px;
}

input {
  width: 100%;
  padding: 8px;
  box-sizing: border-box;
  background-color: var(--input-bg);
  color: var(--text-color);
  border: 1px solid var(--border-color);
}

.form-actions {
  margin-top: 15px;
}

button {
  margin-right: 10px;
  padding: 8px 12px;
  cursor: pointer;
}

.delete-confirm {
  margin-top: 20px;
  padding: 15px;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
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

.clear-filters-btn:hover {
  background-color: #5a6268;
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
  background: var(--modal-bg);
  color: var(--text-color);
  padding: 30px;
  border-radius: 8px;
  min-width: 400px;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
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

.read-only-text {
  display: block;
  width: 100%;
  padding: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
}

.mappings-modal {
  min-width: 800px;
  max-width: 90vw;
}

.mappings-modal .table-container {
  max-height: 400px;
  margin-bottom: 20px;
}

.fixed-action-buttons {
  position: sticky;
  top: 0px;
  background: var(--bg-color, #fff);
  z-index: 100;
  padding: 10px 0;
  border-bottom: 1px solid var(--border-color, #dee2e6);
  margin-bottom: 10px;
}

.field-different {
  background-color: var(--diff-bg, rgba(255, 193, 7, 0.2)) !important;
  border-left: 3px solid var(--diff-border, #ffc107) !important;
  color: var(--text-color) !important;
}

.row-unmatched {
  background-color: var(--unmatched-bg, rgba(220, 53, 69, 0.1)) !important;
}

.row-unmatched td {
  border-left: 3px solid var(--unmatched-border, #dc3545) !important;
}

.blank-cell {
  color: var(--text-muted, #6c757d);
  font-style: italic;
  text-align: center;
  display: block;
  width: 100%;
}




</style>