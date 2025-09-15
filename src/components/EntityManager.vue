<template>
  <div class="entity-manager">
    <div class="header-row">
      <h2>{{ entityName }} Manager</h2>
      <ThemeToggle />
    </div>
    
    <!-- Step Type Filter for STEP_SERVICE_MAPPING -->
    <div v-if="entityName === 'STEP_SERVICE_MAPPING' && !hideFilters" class="filter-section">
      <label for="stepFilter">Filter by Step Type:</label>
      <select id="stepFilter" v-model="selectedStepFilter" @change="filterByStepType">
        <option value="">-- Select a Step Type --</option>
        <option v-for="step in stepTypeOptions" :key="step.value" :value="step.value">
          {{ step.label }}
        </option>
      </select>
    </div>
    
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
    <div class="bordered-section">
      <div class="action-buttons">
        <button @click="loadEntities" class="btn-primary">Refresh</button>
        <button @click="showCreateModal = true" class="btn-success" :disabled="props.readonly">{{ props.readonly ? 'View Only Mode' : 'Add New' }}</button>
        <button @click="confirmBulkDelete" :disabled="selectedEntities.length === 0 || !props.canDelete" class="btn-danger">Delete Selected ({{ selectedEntities.length }})</button>
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
            <tr v-for="entity in filteredEntities" :key="getEntityId(entity)">
              <td class="text-center">
                <input 
                  type="checkbox" 
                  :value="getEntityId(entity)" 
                  v-model="selectedEntities"
                  :aria-label="`Select ${entityName} record ${getEntityId(entity)}`"
                />
              </td>
              <td v-for="field in fields" :key="field">
                <span class="read-only-text">
                  {{ field.includes('DATE') ? formatDate(entity[field]) : 
                     (field === 'SERVICE_ID' && props.entityName === 'SERVICE_PARAM' && entity.SERVICE_DISPLAY) ? 
                     entity.SERVICE_DISPLAY : entity[field] }}
                </span>
              </td>
              <td>
                <button @click="editEntity(entity)" :aria-label="`Edit ${entityName} ${getEntityId(entity)}`">
                  {{ props.readonly ? 'View' : (props.entityName === 'SERVICE_PARAM' && paramMappings.get(getEntityId(entity)) > 0) ? 'Copy & Edit' : 'Edit' }}
                </button>
                <button v-if="props.entityName === 'SERVICE_PARAM' && paramMappings.get(getEntityId(entity)) > 0" @click="showParameterMappings(entity)" class="btn-info" style="margin-left: 5px;">Mappings ({{ paramMappings.get(getEntityId(entity)) }})</button>
                <button v-if="props.entityName === 'ORIGIN_PRODUCT'" @click="openMapping(entity)" class="btn-success" style="margin-left: 5px;">Mapping</button>
                <button v-if="props.entityName === 'ORIGIN_PRODUCT'" @click="openRedirectUrls(entity)" class="btn-info" style="margin-left: 5px;">Redirect URLs</button>
                <button v-if="props.entityName === 'STEP_TYPE'" @click="openStepServices(entity)" class="btn-info" style="margin-left: 5px;">Edit Services</button>
                <button v-if="props.entityName === 'SERVICE'" @click="openServiceParams(entity)" class="btn-info" style="margin-left: 5px;">Parameters</button>
                <button v-if="props.entityName === 'SERVICE'" @click="openServiceStepMapping(entity)" class="btn-info" style="margin-left: 5px;">Step Mappings</button>
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
            <button type="submit">Create</button>
            <button type="button" @click="cancelForm">Cancel</button>
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
            <button type="submit" :disabled="props.readonly">{{ props.readonly ? 'View Only' : 'Update' }}</button>
            <button type="button" @click="cancelForm">Cancel</button>
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
          <button @click="deleteBulkEntities" class="delete-btn" :disabled="isDeleting">{{ isDeleting ? 'Deleting...' : 'Yes, Delete' }}</button>
          <button @click="showDeleteModal = false" :disabled="isDeleting">Cancel</button>
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
import ThemeToggle from './ThemeToggle.vue';
import { useErrorHandler } from '../composables/useErrorHandler';
import { useTableOperations } from '../composables/useTableOperations';
import { useServiceEnhancement } from '../composables/useServiceEnhancement';
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
const showSuccessModal = ref(false);
const successMessage = ref('');

const getEntityId = (entity) => {
  return entity[props.idField];
};

const { selectedItems: selectedEntities, toggleSelectAll: toggleSelectAllItems, sortBy: sortByField, applyFilters: applyTableFilters } = useTableOperations(entities, getEntityId);

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
  
  // For STEP_SERVICE_MAPPING, don't load anything until step type is selected (unless parentId is provided)
  if (props.entityName === 'STEP_SERVICE_MAPPING' && !selectedStepFilter.value && !props.parentId) {
    allEntities.value = [];
    entities.value = [];
    filteredEntities.value = [];
    return;
  }
  

  
  try {
    let allItems = [];
    let nextToken = null;
    const listName = `list${props.entityName}S`;
    
    const response = await props.loadFunction({ limit: 1000 });
    
    if (response.data && response.data[listName] && response.data[listName].items) {
      allItems = response.data[listName].items;
      
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

const openMapping = (entity) => {
  // Emit event to parent to navigate to mapping page
  window.dispatchEvent(new CustomEvent('openMapping', { detail: { productId: entity.ORIGIN_PRODUCT_ID } }));
};

const openRedirectUrls = (entity) => {
  // Emit event to parent to navigate to redirect URLs page
  window.dispatchEvent(new CustomEvent('openRedirectUrls', { detail: { productId: entity.ORIGIN_PRODUCT_ID } }));
};

const openStepServices = (entity) => {
  // Emit event to parent to navigate to step services page
  window.dispatchEvent(new CustomEvent('openStepServices', { detail: { stepTypeId: entity.STEP_TYPE_ID } }));
};

const openServiceParams = (entity) => {
  // Emit event to parent to navigate to service parameters page
  window.dispatchEvent(new CustomEvent('openServiceParams', { detail: { serviceId: entity.SERVICE_ID } }));
};

const openServiceStepMapping = (entity) => {
  // Emit event to parent to navigate to service step mappings page
  window.dispatchEvent(new CustomEvent('openServiceStepMapping', { detail: { serviceId: entity.SERVICE_ID } }));
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
  const newValue = !allSelected.value;
  selectedEntities.value = newValue ? filteredEntities.value.map(getEntityId) : [];
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
    
    console.log('Submitting form data:', cleanedFormData);
    
    if (showEditModal.value) {
      // For SERVICE_PARAM with mappings, create new instead of update
      if (props.entityName === 'SERVICE_PARAM' && paramMappings.value.get(cleanedFormData.SERVICE_PARAM_ID) > 0) {
        // Remove ID fields to create new parameter
        delete cleanedFormData.SERVICE_PARAM_ID;
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
      
      const mappings = mappingsResult.data.listSTEP_SERVICE_MAPPINGS.items;
      const stepTypes = stepTypesResult.data.listSTEP_TYPES.items;
      const services = servicesResult.data.listSERVICES.items;
      
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
        
        if (response.data?.listSERVICE_PARAMS?.items) {
          allItems.push(...response.data.listSERVICE_PARAMS.items);
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
    await loadStepTypeFilterOptions();
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
    const result = await getClient().graphql({ query: queries.listServiceProviders });
    const providers = result.data.listSERVICE_PROVIDERS.items;
    
    // Update the SERVICE_PROVIDER_ID field options
    const providerIdField = props.formFields.find(f => f.name === 'SERVICE_PROVIDER_ID');
    if (providerIdField) {
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
    const stepTypes = result.data.listSTEP_TYPES.items;
    
    stepTypeOptions.value = stepTypes.map(step => ({
      value: step.STEP_TYPE_ID,
      label: `${step.STEP_TYPE_ID}: ${step.STEP_TYPE_NAME}`
    }));
  } catch (error) {
    console.error('Error loading step type options:', error);
  }
};

const loadStepServiceMappingOptions = async () => {
  try {
    const [stepTypesResult, servicesResult, providersResult] = await Promise.all([
      getClient().graphql({ query: queries.listStepTypes }),
      getClient().graphql({ query: queries.listServices }),
      getClient().graphql({ query: queries.listServiceProviders })
    ]);
    
    const stepTypes = stepTypesResult.data.listSTEP_TYPES.items;
    const services = servicesResult.data.listSERVICES.items;
    const providers = providersResult.data.listSERVICE_PROVIDERS.items;
    
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
      allServiceParams.push(...serviceParamsResult.data.listSERVICE_PARAMS.items);
      nextToken = serviceParamsResult.data.listSERVICE_PARAMS.nextToken;
    } while (nextToken);
    
    const [mappingsResult, productsResult, servicesResult] = await Promise.all([
      getClient().graphql({ query: queries.listServiceParamMappings }),
      getClient().graphql({ query: queries.listOriginProducts }),
      getClient().graphql({ query: queries.listServices })
    ]);
    
    const allMappings = mappingsResult.data.listSERVICE_PARAM_MAPPINGS.items;
    const products = productsResult.data.listOrigin_products.items;
    const services = servicesResult.data.listSERVICES.items;
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
      
      return {
        SERVICE_PARAM_MAPPING_ID: mapping.SERVICE_PARAM_MAPPING_ID,
        PSCU_CLIENT_ID: product?.PSCU_CLIENT_ID || 'N/A',
        PRODUCT_ID: product?.PRODUCT_ID || 'N/A',
        SOURCE_SERVICE: sourceServiceDisplay,
        TARGET_SERVICE: targetServiceDisplay
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
    const mappings = result.data.listSERVICE_PARAM_MAPPINGS.items;
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
    
    if (response.data && response.data[listName] && response.data[listName].items) {
      const uniqueVendors = [...new Set(
        response.data[listName].items
          .map(item => item.VENDOR_NAME)
          .filter(name => name && name.trim())
      )].sort();
      
      vendorNames.value = uniqueVendors;
    }
  } catch (error) {
    console.error('Error loading vendor names:', error);
  }
};

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
  word-wrap: break-word;
  white-space: normal;
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




</style>