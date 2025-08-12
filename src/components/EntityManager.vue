<template>
  <div class="entity-manager">
    <h2>{{ entityName }} Manager</h2>
    
    <!-- Entity List -->
    <div class="entity-list">
      <button @click="loadEntities" class="btn-primary">Refresh</button>
      <button @click="showCreateModal = true" class="btn-success">Add New</button>
      <button @click="confirmBulkDelete" :disabled="selectedEntities.length === 0" class="btn-danger">Delete Selected ({{ selectedEntities.length }})</button>
      
      <table v-if="entities.length > 0">
        <thead>
          <tr>
            <th class="checkbox-col">
              <input type="checkbox" @change="toggleSelectAll" :checked="allSelected" />
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
            <th class="checkbox-col"></th>
            <th v-for="field in fields" :key="`filter-${field}`">
              <input 
                v-model="filters[field]" 
                @input="applyFilters"
                :placeholder="`Filter ${field}`"
                class="filter-input"
              />
            </th>
            <th>
              <button @click="clearFilters" class="clear-filters-btn">Clear</button>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="entity in filteredEntities" :key="getEntityId(entity)">
            <td class="checkbox-col">
              <input type="checkbox" :value="getEntityId(entity)" v-model="selectedEntities" />
            </td>
            <td v-for="field in fields" :key="field">{{ entity[field] }}</td>
            <td>
              <button @click="editEntity(entity)">Edit</button>
              <button v-if="props.entityName === 'ORIGIN_PRODUCT'" @click="openMapping(entity)" class="btn-success" style="margin-left: 5px;">Mapping</button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-else>No {{ entityName }} records found.</p>
    </div>
    
    <!-- Create Modal -->
    <div v-if="showCreateModal" class="modal-overlay">
      <div class="modal-content">
        <h3>Create {{ entityName }}</h3>
        <form @submit.prevent="submitForm">
          <div v-for="field in formFields" :key="field.name" class="form-group">
            <label :for="field.name">{{ field.name }}</label>
            <select 
              v-if="field.type === 'select'"
              :id="field.name" 
              v-model="formData[field.name]" 
              :required="field.required"
              :disabled="field.disabled"
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
              :type="field.type" 
              :required="field.required"
              :disabled="field.disabled || field.name === 'CREATED_DATE' || field.name === 'MODIFIED_DATE'"
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
          <div v-for="field in formFields" :key="field.name" class="form-group">
            <label :for="field.name">{{ field.name }}</label>
            <select 
              v-if="field.type === 'select'"
              :id="field.name" 
              v-model="formData[field.name]" 
              :required="field.required"
              :disabled="field.disabled"
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
              :type="field.type" 
              :required="field.required"
              :disabled="field.disabled || field.name === 'CREATED_DATE' || field.name === 'MODIFIED_DATE'"
            />
          </div>
          <div class="form-actions">
            <button type="submit">Update</button>
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, defineProps, watch } from 'vue';

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
  }
});

const entities = ref([]);
const filteredEntities = ref([]);
const filters = ref({});
const formData = ref({});
const showCreateModal = ref(false);
const showEditModal = ref(false);
const showDeleteModal = ref(false);
const showErrorModal = ref(false);
const errorMessage = ref('');
const selectedEntities = ref([]);
const allSelected = ref(false);
const isResizing = ref(false);
const resizeData = ref({ field: '', startX: 0, startWidth: 0 });
const isDeleting = ref(false);
const deleteProgress = ref({ current: 0, total: 0 });
const sortField = ref('');
const sortDirection = ref('asc');

const getEntityId = (entity) => {
  return entity[props.idField];
};

const loadEntities = async () => {
  try {
    const response = await props.loadFunction();
    const listName = `list${props.entityName}S`;
    
    if (response.data && response.data[listName] && response.data[listName].items) {
      entities.value = response.data[listName].items;
      filteredEntities.value = response.data[listName].items;
    } else {
      entities.value = [];
      filteredEntities.value = [];
    }
  } catch (error) {
    console.error(`Error loading ${props.entityName}:`, error);
    errorMessage.value = error.message || `Failed to load ${props.entityName} records`;
    showErrorModal.value = true;
    entities.value = [];
    filteredEntities.value = [];
  }
};

const editEntity = (entity) => {
  formData.value = { ...entity };
  showEditModal.value = true;
};

const openMapping = (entity) => {
  // Emit event to parent to navigate to mapping page
  window.dispatchEvent(new CustomEvent('openMapping', { detail: { productId: entity.ORIGIN_PRODUCT_ID } }));
};

const confirmBulkDelete = () => {
  if (selectedEntities.value.length > 0) {
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
    console.error(`Error deleting ${props.entityName}:`, error);
    errorMessage.value = error.message || `Failed to delete ${props.entityName} records`;
    showErrorModal.value = true;
  } finally {
    isDeleting.value = false;
    showDeleteModal.value = false;
  }
};

const toggleSelectAll = () => {
  if (allSelected.value) {
    selectedEntities.value = [];
  } else {
    selectedEntities.value = filteredEntities.value.map(entity => getEntityId(entity));
  }
  allSelected.value = !allSelected.value;
};

// Set current date in YYYY-MM-DD format for CREATED_DATE when creating a new entity
watch(showCreateModal, (newVal) => {
  if (newVal) {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const year = today.getFullYear();
    formData.value = {
      ...formData.value,
      CREATED_DATE: `${year}-${month}-${day}`
    };
  }
});

// Watch selected entities to update allSelected state
watch(selectedEntities, () => {
  allSelected.value = selectedEntities.value.length === filteredEntities.value.length && filteredEntities.value.length > 0;
}, { deep: true });

const submitForm = async () => {
  try {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const year = today.getFullYear();
    const currentDate = `${year}-${month}-${day}`;
    
    // Skip automatic date fields for entities that don't support them
    const skipDateFields = props.entityName === 'STEP_SERVICE_MAPPING';
    
    // Clean form data for STEP_SERVICE_MAPPING
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
    
    console.log('Submitting form data:', cleanedFormData);
    
    if (showEditModal.value) {
      // Set MODIFIED_DATE for updates (if supported)
      if (!skipDateFields) {
        cleanedFormData.MODIFIED_DATE = currentDate;
      }
      await props.updateFunction(cleanedFormData);
    } else {
      // Set CREATED_DATE for new records (if supported)
      if (!skipDateFields && !cleanedFormData.CREATED_DATE) {
        cleanedFormData.CREATED_DATE = currentDate;
      }
      // Don't add any automatic fields for STEP_SERVICE_MAPPING
      await props.createFunction(cleanedFormData);
    }
    cancelForm();
    await loadEntities();
  } catch (error) {
    console.error(`Error saving ${props.entityName}:`, error);
    let errorMsg = error.message || `Failed to save ${props.entityName} record`;
    
    // Extract GraphQL error details
    if (error.errors && error.errors.length > 0) {
      errorMsg = error.errors.map(e => e.message).join(', ');
    }
    
    errorMessage.value = errorMsg;
    showErrorModal.value = true;
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

// Watch for entityName changes and reload data
watch(() => props.entityName, async () => {
  filters.value = {};
  selectedEntities.value = [];
  allSelected.value = false;
  sortField.value = '';
  sortDirection.value = 'asc';
  
  // Load service options for SERVICE_PARAM entity
  if (props.entityName === 'SERVICE_PARAM') {
    await loadServiceOptions();
  }
  
  // Load service provider options for SERVICE entity
  if (props.entityName === 'SERVICE') {
    await loadServiceProviderOptions();
  }
  
  // Load step and service options for STEP_SERVICE_MAPPING entity
  if (props.entityName === 'STEP_SERVICE_MAPPING') {
    await loadStepServiceMappingOptions();
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

const loadServiceOptions = async () => {
  try {
    const response = await fetch('https://fi5pjed64nf4ran34tusrlvi7u.appsync-api.us-east-2.amazonaws.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'da2-qfwm2qhugrbilizrqickmeg5oi'
      },
      body: JSON.stringify({
        query: `
          query ListServices {
            listSERVICES {
              items {
                SERVICE_ID
                URI
              }
            }
          }
        `
      })
    });
    
    const result = await response.json();
    const services = result.data.listSERVICES.items;
    
    // Update the SERVICE_ID field options
    const serviceIdField = props.formFields.find(f => f.name === 'SERVICE_ID');
    if (serviceIdField) {
      serviceIdField.options = services.map(service => ({
        value: service.SERVICE_ID,
        label: `${service.SERVICE_ID} - ${service.URI}`
      }));
    }
  } catch (error) {
    console.error('Error loading service options:', error);
  }
};

const loadServiceProviderOptions = async () => {
  try {
    const response = await fetch('https://fi5pjed64nf4ran34tusrlvi7u.appsync-api.us-east-2.amazonaws.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'da2-qfwm2qhugrbilizrqickmeg5oi'
      },
      body: JSON.stringify({
        query: `
          query ListServiceProviders {
            listSERVICE_PROVIDERS {
              items {
                SERVICE_PROVIDER_ID
                SERVICE_PROVIDER_NAME
              }
            }
          }
        `
      })
    });
    
    const result = await response.json();
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

const loadStepServiceMappingOptions = async () => {
  try {
    const [stepTypesResponse, servicesResponse, providersResponse] = await Promise.all([
      fetch('https://fi5pjed64nf4ran34tusrlvi7u.appsync-api.us-east-2.amazonaws.com/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'da2-qfwm2qhugrbilizrqickmeg5oi'
        },
        body: JSON.stringify({
          query: `
            query ListStepTypes {
              listSTEP_TYPES {
                items {
                  STEP_TYPE_ID
                  STEP_TYPE_NAME
                }
              }
            }
          `
        })
      }),
      fetch('https://fi5pjed64nf4ran34tusrlvi7u.appsync-api.us-east-2.amazonaws.com/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'da2-qfwm2qhugrbilizrqickmeg5oi'
        },
        body: JSON.stringify({
          query: `
            query ListServices {
              listSERVICES {
                items {
                  SERVICE_ID
                  URI
                  SERVICE_PROVIDER_ID
                }
              }
            }
          `
        })
      }),
      fetch('https://fi5pjed64nf4ran34tusrlvi7u.appsync-api.us-east-2.amazonaws.com/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'da2-qfwm2qhugrbilizrqickmeg5oi'
        },
        body: JSON.stringify({
          query: `
            query ListServiceProviders {
              listSERVICE_PROVIDERS {
                items {
                  SERVICE_PROVIDER_ID
                  SERVICE_PROVIDER_NAME
                }
              }
            }
          `
        })
      })
    ]);
    
    const stepTypesResult = await stepTypesResponse.json();
    const servicesResult = await servicesResponse.json();
    const providersResult = await providersResponse.json();
    
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

onMounted(async () => {
  if (props.entityName === 'SERVICE_PARAM') {
    await loadServiceOptions();
  }
  if (props.entityName === 'SERVICE') {
    await loadServiceProviderOptions();
  }
  if (props.entityName === 'STEP_SERVICE_MAPPING') {
    await loadStepServiceMappingOptions();
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
  display: flex;
  flex-direction: column;
}

.entity-manager h2 {
  position: sticky;
  top: 0;
  background: white;
  z-index: 20;
  margin: 0;
  padding: 10px 0;
}

.entity-list {
  flex: 1;
  overflow: auto;
}

.entity-list {
  flex: 1;
  overflow: auto;
}

.entity-list > button {
  position: sticky;
  top: 0;
  z-index: 25;
  margin-bottom: 10px;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}

table thead {
  position: sticky;
  top: 50px;
  z-index: 10;
}

th {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
  background-color: #f2f2f2;
  position: sticky;
  top: 0;
}

.filter-row th {
  background-color: #e9ecef;
  padding: 4px;
  position: sticky;
  top: 41px;
}

td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
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

.checkbox-col {
  width: 40px;
  text-align: center;
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
  background-color: #e9ecef;
}

.sort-indicator {
  margin-left: 5px;
  font-weight: bold;
}
</style>