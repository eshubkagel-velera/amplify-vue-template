<template>
  <div class="entity-manager">
    <!-- Entity Data Loader -->
    <EntityDataLoader
      :entity-name="entityName"
      :config="entityConfig"
      :form-fields="formFields"
      :load-function="loadFunction"
      :selected-service-filter="selectedServiceFilter"
      :selected-product-filter="selectedProductFilter"
      :selected-step-filter="selectedStepFilter"
      @options-loaded="handleOptionsLoaded"
      @vendor-names-loaded="handleVendorNamesLoaded"
    />
    
    <!-- Entity Filter Processor -->
    <EntityFilterProcessor
      :entity-name="entityName"
      :config="entityConfig"
      :all-entities="allEntities"
      :selected-service-filter="selectedServiceFilter"
      :selected-product-filter="selectedProductFilter"
      :selected-step-filter="selectedStepFilter"
      @entities-filtered="handleEntitiesFiltered"
    />
    
    <!-- Entity Form Processor -->
    <EntityFormProcessor
      ref="formProcessor"
      :entity-name="entityName"
      :config="entityConfig"
      :form-data="formData"
      :form-fields="formFields"
      :user-profile-id="userProfileId"
      :param-mappings="paramMappings"
      @form-processed="handleFormProcessed"
    />
    
    <!-- Entity Filters -->
    <EntityFilters
      :entity-name="entityName"
      :show-filters="!hideFilters && entityConfig.hasFilters && !parentId"
      :service-options="serviceOptions"
      :product-options="productOptions"
      :service-filter="selectedServiceFilter"
      :product-filter="selectedProductFilter"
      @service-change="handleServiceChange"
      @product-change="handleProductChange"
    />
    
    <!-- Action Buttons (only when not a child screen) -->
    <div v-if="!hideActionButtons && !parentId" class="fixed-action-buttons">
      <div class="action-buttons">
        <button @click="loadEntities" class="btn-primary">Refresh</button>
        <button 
          v-if="canCreateEntity" 
          @click="showCreateModal = true" 
          class="btn-success" 
          :disabled="readonly"
        >
          {{ readonly ? 'View Only Mode' : 'Add New' }}
        </button>
        <button 
          v-if="canDeleteEntity" 
          @click="confirmBulkDelete" 
          :disabled="selectedEntities.length === 0" 
          class="btn-danger"
        >
          Delete Selected ({{ selectedEntities.length }})
        </button>
        <span class="record-count">{{ entities.length }} records</span>
      </div>
    </div>
    

    
    <!-- Data Table -->
    <div class="entity-list">
      <LoadingSkeleton v-if="loading" :rows="5" :columns="filteredFields.length + 2" />
      <DataTable
        v-else-if="entities.length > 0"
        :data="displayEntities"
        :fields="comparisonMode ? (entityConfig.comparisonConfig?.comparisonFields || entityConfig.comparisonFields || props.fields) : filteredFields"
        :filters="filters"
        :sort-field="sortField"
        :sort-direction="sortDirection"
        :selected-items="selectedEntities"
        :all-selected="allSelected"
        :show-selection="!comparisonMode"
        :comparison-mode="comparisonMode"
        :field-differences="fieldDifferences"
        :id-field="idField"
        @scroll="$emit('scroll', $event)"
        @toggle-select-all="toggleSelectAll"
        @sort="sortBy"
        @start-resize="startResize"
        @clear-filters="clearFilters"
        @update-filter="updateFilter"
        @toggle-selection="toggleSelection"
      >
        <template #actions="{ entity }">
          <ActionButtons
            :entity="entity"
            :entity-name="entityName"
            :readonly="readonly"
            :comparison-mode="comparisonMode"
            :hide-row-actions="hideRowActions"
            :can-add-to-other="canAddToOtherEnvironment"
            :other-environment="getOtherEnvironmentName()"
            :is-matched="isRecordMatched(entity)"
            :has-differences="hasFieldDifferences(entity)"
            :mapping-count="getMappingCount(entity)"
            :redirect-url-count="getRedirectUrlCount(entity)"
            :parameter-count="getParameterCount(entity)"
            :step-mapping-count="getStepMappingCount(entity)"
            :step-service-count="getStepServiceCount(entity)"
            :copy-on-edit-with-mappings="entityConfig.copyOnEditWithMappings"
            @edit="editEntity"
            @add-to-other="addToOtherEnvironment"
            @copy-differences="copyDifferencesToOther"
            @show-mappings="showParameterMappings"
            @open-mapping="openMapping"
            @open-redirect-urls="openRedirectUrls"
            @open-step-services="openStepServices"
            @open-service-params="openServiceParams"
            @open-service-step-mapping="openServiceStepMapping"
          />
        </template>
      </DataTable>
      <p v-else-if="!loading">No {{ entityName }} records found.</p>
    </div>
    
    <!-- Progress Modal -->
    <ProgressModal
      :show="showProgressModal"
      :operation="progressData.operation"
      :current="progressData.current"
      :total="progressData.total"
    />
    
    <!-- Parameter Mappings Modal -->
    <ParameterMappingsModal
      :show="showMappingsModal"
      :param-name="selectedParamName"
      :mappings="selectedParamMappings"
      @close="showMappingsModal = false"
    />
    
    <!-- Copy Differences Modal -->
    <CopyDifferencesModal
      :show="showCopyModal"
      :entity="copyData?.entity"
      :target-environment="copyData?.targetEnvironment"
      :different-fields="getDifferentFields(copyData?.entity)"
      @confirm="confirmCopy"
      @cancel="cancelCopy"
    />
    
    <!-- Modals -->
    <BaseModal
      :show="showCreateModal"
      :title="`Create ${entityName}`"
      confirm-text="Create"
      confirm-class="btn-success"
      @confirm="submitForm"
      @cancel="cancelForm"
    >
      <form @submit.prevent="submitForm">
        <!-- Helper filters for SERVICE_PARAM_MAPPING selection -->
        <div v-if="entityConfig.helperFilters" class="helper-filters">
          <h4>Filter Options:</h4>
          <div v-for="filter in entityConfig.helperFilters" :key="filter.name" class="form-group">
            <label :for="filter.name">{{ filter.label }}</label>
            <select 
              v-if="filter.type === 'select'"
              :id="filter.name" 
              v-model="helperFilterData[filter.name]" 
              @change="filterServiceParamMappings"
            >
              <option value="">-- All {{ filter.label }} --</option>
              <option v-for="option in getHelperFilterOptions(filter)" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
            <input 
              v-else
              :id="filter.name" 
              v-model="helperFilterData[filter.name]" 
              :type="filter.type" 
              @input="filterServiceParamMappings"
            />
          </div>
          <hr>
        </div>
        
        <div v-for="field in createFormFields" :key="field.name" class="form-group">
          <label :for="field.name">{{ field.name }}</label>
          <select 
            v-if="field.type === 'select'"
            :id="field.name" 
            v-model="formData[field.name]" 
            :required="field.required"
            :disabled="field.disabled"
          >
            <option value="">-- Select {{ field.name }} --</option>
            <option v-for="option in getFieldOptions(field)" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
          <input 
            v-else
            :id="field.name" 
            v-model="formData[field.name]" 
            :type="field.name.includes('DATE') ? 'date' : field.type" 
            :required="field.required"
            :disabled="field.disabled"
          />
          
          <!-- Integrated filter dropdowns below the field they filter -->
          <div v-if="entityConfig.integratedFilters && entityConfig.integratedFilters[field.name]" class="integrated-filters">
            <div v-for="filter in (Array.isArray(entityConfig.integratedFilters[field.name]) ? entityConfig.integratedFilters[field.name] : [entityConfig.integratedFilters[field.name]])" :key="filter.filterField" class="integrated-filter">
              <label :for="filter.filterField" class="filter-label">
                ↳ Filter by {{ filter.filterLabel }}
              </label>
              <select 
                :id="filter.filterField"
                v-model="helperFilterData[filter.filterField]"
                @change="filterIntegratedOptions(field.name)"
                class="filter-dropdown"
              >
                <option value="">-- Select {{ filter.filterLabel }} --</option>
                <option v-for="option in getIntegratedFilterOptions(filter)" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </div>
          </div>
        </div>
      </form>
    </BaseModal>

    <BaseModal
      :show="showEditModal"
      :title="`Edit ${entityName}`"
      :confirm-text="readonly ? 'View Only' : 'Update'"
      confirm-class="btn-success"
      :loading="readonly"
      @confirm="submitForm"
      @cancel="cancelForm"
    >
      <form @submit.prevent="submitForm">
        <div v-for="field in editFormFields" :key="field.name" class="form-group">
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
            :type="field.name.includes('DATE') ? 'date' : field.type" 
            :required="field.required"
            :disabled="field.disabled"
          />
        </div>
      </form>
    </BaseModal>

    <BaseModal
      :show="showDeleteModal"
      title="Confirm Delete"
      confirm-text="Yes, Delete"
      confirm-class="btn-danger"
      @confirm="deleteBulkEntities"
      @cancel="showDeleteModal = false"
    >
      <p>Are you sure you want to delete {{ selectedEntities.length }} record(s)?</p>
    </BaseModal>

    <BaseModal
      :show="showSuccessModal"
      :title="successMessage.includes('Error') ? 'Error' : 'Success'"
    >
      <p>{{ successMessage }}</p>
      <template #actions>
        <button @click="showSuccessModal = false" class="btn-primary">OK</button>
      </template>
    </BaseModal>

    <BaseModal
      :show="showErrorModal"
      title="Error"
      confirm-text="OK"
      confirm-class="btn-primary"
      @confirm="clearError"
      @cancel="clearError"
    >
      <div>
        <p><strong>Action:</strong> {{ errorAction }}</p>
        <p><strong>Error:</strong> {{ error }}</p>
      </div>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import '../styles/shared.css';
import { ref, computed, onMounted, watch } from 'vue';
import LoadingSkeleton from './LoadingSkeleton.vue';
import BaseModal from './shared/BaseModal.vue';
import DataTable from './shared/DataTable.vue';
import EntityFilters from './shared/EntityFilters.vue';
import ActionButtons from './shared/ActionButtons.vue';
import EntityDataLoader from './entity-specific/EntityDataLoader.vue';
import EntityFilterProcessor from './entity-specific/EntityFilterProcessor.vue';
import EntityFormProcessor from './entity-specific/EntityFormProcessor.vue';
import ProgressModal from './shared/ProgressModal.vue';
import ParameterMappingsModal from './shared/ParameterMappingsModal.vue';
import CopyDifferencesModal from './shared/CopyDifferencesModal.vue';
import { useErrorHandler } from '../composables/useErrorHandler';
import { useTableOperations } from '../composables/useTableOperations';
import { useAuth } from '../composables/useAuth';
import { useHelperFilters } from '../composables/useHelperFilters';
import { formatDate, getCurrentDateString } from '../utils/dateUtils';
import { getEntityConfig } from '../config/entityConfigLoader.js';
import { fetchUserAttributes } from 'aws-amplify/auth';
import * as queries from '../graphql/queries.js';
import { onUnmounted } from 'vue';
import tableConfig from '../../config/table_config.json';

const props = defineProps({
  entityName: { type: String, required: true },
  fields: { type: Array, required: true },
  formFields: { type: Array, required: true },
  idField: { type: String, required: true },
  loadFunction: { type: Function, required: true },
  createFunction: { type: Function, required: true },
  updateFunction: { type: Function, required: true },
  deleteFunction: { type: Function, required: true },
  hideFilters: { type: Boolean, default: false },
  readonly: { type: Boolean, default: false },
  hideActionButtons: { type: Boolean, default: false },
  hideRowActions: { type: Boolean, default: false },
  fieldDifferences: { type: Map, default: () => new Map() },
  comparisonMode: { type: String, default: null },
  otherEnvironment: { type: String, default: '' },
  canAddToOther: { type: Boolean, default: false },
  parentId: { type: [Number, String], default: null },
  parentField: { type: String, default: null },
  canDelete: { type: Boolean, default: true },
  matchedPairs: { type: Array, default: () => [] },
  unmatchedRecords: { type: Array, default: () => [] },
  primaryData: { type: Array, default: () => [] },
  syncFilters: { type: Object, default: () => ({}) },
  syncSort: { type: Object, default: () => ({ field: '', direction: 'asc' }) },
  productFilter: { type: String, default: '' },
  serviceFilter: { type: String, default: '' }
});

// Reactive data
const entities = ref([]);
const allEntities = ref([]);
const filteredEntities = ref([]);
const filters = ref({});
const formData = ref({});
const showCreateModal = ref(false);
const showEditModal = ref(false);
const showDeleteModal = ref(false);
const showSuccessModal = ref(false);
const successMessage = ref('');
const loading = ref(false);
const showProgressModal = ref(false);
const progressData = ref({ current: 0, total: 0, operation: '' });
const showMappingsModal = ref(false);
const selectedParamMappings = ref([]);
const selectedParamName = ref('');
const showCopyModal = ref(false);
const copyData = ref(null);
const isResizing = ref(false);
const resizeData = ref({ field: '', startX: 0, startWidth: 0 });
const sortField = ref('');
const sortDirection = ref('asc');
const selectedServiceFilter = ref('');
const selectedProductFilter = ref('');
const selectedStepFilter = ref('');
const serviceOptions = ref([]);
const productOptions = ref([]);
const vendorNames = ref([]);
const relationshipCounts = ref(new Map());
const filteredServiceParamMappings = ref([]);
const allServiceParamMappings = ref([]);
const paramMappings = ref(new Map());
const userProfileId = ref(null);

// Use helper filters composable
const { helperFilterData, loadHelperFilterData: loadHelperFilters, getHelperFilterOptions, resetHelperFilters } = useHelperFilters();
const formProcessor = ref(null);
const foreignKeyLookups = ref(new Map());

// Entity configuration
const entityConfig = computed(() => getEntityConfig(props.entityName));

// Table permissions
const canCreateEntity = computed(() => {
  const tablePerms = tableConfig.tables[props.entityName];
  return tablePerms?.allowCreate !== false;
});

const canDeleteEntity = computed(() => {
  const tablePerms = tableConfig.tables[props.entityName];
  return tablePerms?.allowDelete !== false;
});

// Composables
const { handleError, error, errorAction, showErrorModal, clearError } = useErrorHandler();
const { canDelete } = useAuth();

// Computed
const getEntityId = (entity) => entity[props.idField];
const { selectedItems: selectedEntities, toggleSelectAll: toggleSelectAllItems } = useTableOperations(entities, getEntityId);

const allSelected = computed(() => 
  filteredEntities.value.length > 0 && selectedEntities.value.length === filteredEntities.value.length
);

const filteredFields = computed(() => {
  // If entity doesn't have audit fields, return fields as-is
  if (entityConfig.value.hasAuditFields === false) {
    return props.fields;
  }
  
  const baseFields = props.fields.filter(field => 
    !['CREATED_BY_USER_ID', 'CREATED_DATE', 'CHANGED_BY_USER_ID', 'CHANGED_DATE'].includes(field)
  );
  
  const hasChangedData = entities.value.some(entity => 
    entity.CHANGED_BY_USER_ID || entity.CHANGED_DATE
  );
  
  return hasChangedData 
    ? [...baseFields, 'CHANGED_BY_USER_ID', 'CHANGED_DATE']
    : [...baseFields, 'CREATED_BY_USER_ID', 'CREATED_DATE'];
});

const displayEntities = computed(() => {
  if (!props.comparisonMode) {
    return filteredEntities.value;
  }
  
  if (props.comparisonMode === 'primary') {
    const filtered = filteredEntities.value;
    const ordered = [];
    
    ordered.push(...filtered);
    
    const unmatchedCompareCount = props.unmatchedRecords.length;
    for (let i = 0; i < unmatchedCompareCount; i++) {
      ordered.push({ __isBlank: true });
    }
    
    return ordered;
  } else {
    const filtered = filteredEntities.value;
    const ordered = [];
    
    const primaryFiltered = props.primaryData.filter(entity => {
      const fieldsToCheck = entityConfig.value.comparisonConfig?.comparisonFields || entityConfig.value.comparisonFields || props.fields;
      return fieldsToCheck.every(field => {
        const filterValue = filters.value[field];
        if (!filterValue) return true;
        const entityValue = String(entity[field] || '').toLowerCase();
        return entityValue.includes(filterValue.toLowerCase());
      });
    });
    
    if (sortField.value) {
      primaryFiltered.sort((a, b) => {
        const aVal = String(a[sortField.value] || '').toLowerCase();
        const bVal = String(b[sortField.value] || '').toLowerCase();
        const comparison = aVal.localeCompare(bVal);
        return sortDirection.value === 'asc' ? comparison : -comparison;
      });
    }
    
    primaryFiltered.forEach(primaryRecord => {
      const primaryId = primaryRecord[props.idField];
      const matchInfo = props.fieldDifferences.get(primaryId);
      
      if (matchInfo && matchInfo.compareId) {
        const matchedRecord = filtered.find(record => 
          record[props.idField] === matchInfo.compareId
        );
        if (matchedRecord) {
          ordered.push(matchedRecord);
        } else {
          ordered.push({ __isBlank: true });
        }
      } else {
        ordered.push({ __isBlank: true });
      }
    });
    
    const usedCompareIds = new Set();
    props.fieldDifferences.forEach(info => {
      if (info.compareId) {
        usedCompareIds.add(info.compareId);
      }
    });
    
    const unmatchedCompareRecords = filtered.filter(record => 
      !usedCompareIds.has(record[props.idField])
    );
    
    ordered.push(...unmatchedCompareRecords);
    
    return ordered;
  }
});

const canAddToOtherEnvironment = computed(() => props.comparisonMode && props.canAddToOther);

const createFormFields = computed(() => {
  return props.formFields.filter(field => field.name !== 'CHANGED_DATE' && field.name !== 'CHANGED_BY_USER_ID');
});

const editFormFields = computed(() => {
  return props.formFields.filter(field => field.name !== 'CREATED_DATE' && field.name !== 'CREATED_BY_USER_ID');
});

// Emits
const emit = defineEmits([
  'scroll', 'entityCountChanged', 'selectedCountChanged', 'filterChanged', 
  'sortChanged', 'addToOtherEnvironment', 'copyDifferencesToOther', 'recordUpdated',
  'openMapping', 'openRedirectUrls', 'openStepServices', 'openServiceParams', 'openServiceStepMapping'
]);

// Methods
const loadEntities = async () => {
  loading.value = true;
  try {
    const response = await props.loadFunction({ limit: 1000 });
    const listName = `list${props.entityName}S`;
    
    if (response.data && response.data[listName]) {
      let items = response.data[listName].items || [];
      
      // Entity-specific enhancements
      if (entityConfig.value.enhanceWithServiceDisplay && props.entityName === 'SERVICE_PARAM') {
        try {
          const { useServiceEnhancement } = await import('../composables/useServiceEnhancement.js');
          const { enhanceServiceParams } = useServiceEnhancement();
          items = await enhanceServiceParams(items);
        } catch (error) {
          console.warn('Service enhancement failed:', error);
        }
      }
      
      // Load relationship counts
      await loadRelationshipCounts();
      
      // Load service param mappings for filtering if needed
      if (props.entityName === 'STEP_TYPE_PARAM_MAP') {
        await loadServiceParamMappingsForFiltering();
      }
      
      // Load helper filter data for entities that need it
      if (entityConfig.value.helperFilters || entityConfig.value.integratedFilters) {
        const { getClient } = await import('../client.js');
        if (entityConfig.value.helperFilters) {
          await loadHelperFilters(entityConfig.value, getClient());
        }
        if (entityConfig.value.integratedFilters) {
          await loadIntegratedFilterData();
        }
      }
      
      // Enhance with foreign key display values
      if (entityConfig.value.foreignKeys) {
        items = await enhanceWithForeignKeys(items);
      }
      
      // Enhance items with custom display fields
      if (entityConfig.value.customDisplayFields && props.entityName === 'STEP_TYPE_PARAM_MAP') {
        items = await enhanceServiceParamMappingDisplay(items);
      }
      
      allEntities.value = items;
      
      // Apply entity-specific loading rules
      if (entityConfig.value.requiresServiceFilter && !selectedServiceFilter.value && !props.parentId) {
        entities.value = [];
        filteredEntities.value = [];
      } else {
        // Filter by parent ID if provided
        if (props.parentId && props.parentField) {
          items = items.filter(item => item[props.parentField] === props.parentId);
        }
        
        entities.value = items;
        filteredEntities.value = items;
        
        // Re-apply active filters after loading
        if (selectedProductFilter.value) {
          handleProductChange(selectedProductFilter.value);
        }
        if (selectedServiceFilter.value) {
          handleServiceChange(selectedServiceFilter.value);
        }
        if (selectedStepFilter.value) {
          // Handle step filter if needed
        }
      }
    }
    
    emit('entityCountChanged', entities.value.length);
  } catch (error) {
    handleError(error, `loading ${props.entityName}`);
    entities.value = [];
    filteredEntities.value = [];
  } finally {
    loading.value = false;
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
    
    if (userProfileId.value && formattedEntity.CHANGED_BY_USER_ID !== undefined) {
      formattedEntity.CHANGED_BY_USER_ID = userProfileId.value;
    }
    if (formattedEntity.CHANGED_DATE !== undefined) {
      formattedEntity.CHANGED_DATE = getCurrentDateString();
    }
    
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
  
  // Ensure foreign key fields match dropdown option values (convert to numbers)
  if (entityConfig.value.foreignKeys) {
    Object.keys(entityConfig.value.foreignKeys).forEach(fieldName => {
      if (formattedEntity[fieldName] !== undefined && formattedEntity[fieldName] !== null) {
        formattedEntity[fieldName] = parseInt(formattedEntity[fieldName]);
      }
    });
  }
  
  // Set current date and user ID for modifications
  formattedEntity.CHANGED_DATE = getCurrentDateString();
  if (props.formFields.some(field => field.name === 'CHANGED_BY_USER_ID')) {
    formattedEntity.CHANGED_BY_USER_ID = userProfileId.value || 1;
  }
  
  formData.value = formattedEntity;
  showEditModal.value = true;
};

const submitForm = async () => {
  if (props.readonly && showEditModal.value) return;
  
  try {
    const isUpdate = formData.value[props.idField] !== undefined;
    const processedData = formProcessor.value.processFormData(isUpdate);
    
    if (processedData.shouldCreateCopy) {
      await props.createFunction(processedData.cleanedFormData);
      successMessage.value = `New ${props.entityName} created (original has mappings)!`;
    } else if (isUpdate) {
      await props.updateFunction(processedData.cleanedFormData);
      successMessage.value = `${props.entityName} updated successfully!`;
    } else {
      await props.createFunction(processedData.cleanedFormData);
      successMessage.value = `${props.entityName} created successfully!`;
    }
    
    showSuccessModal.value = true;
    cancelForm();
    await loadEntities();
    
    if (props.comparisonMode) {
      emit('recordUpdated', processedData.cleanedFormData);
    }
  } catch (error) {
    handleError(error, `saving ${props.entityName}`);
  }
};

const cancelForm = () => {
  formData.value = {};
  showCreateModal.value = false;
  showEditModal.value = false;
};

const confirmBulkDelete = () => {
  if (selectedEntities.value.length > 0) {
    // For SERVICE_PARAM, check if any selected params have mappings
    if (props.entityName === 'SERVICE_PARAM') {
      const paramsWithMappings = selectedEntities.value.filter(id => 
        paramMappings.value.get(id) > 0
      );
      
      if (paramsWithMappings.length > 0) {
        successMessage.value = `Cannot delete ${paramsWithMappings.length} parameter(s) that have existing mappings`;
        showSuccessModal.value = true;
        return;
      }
    }
    showDeleteModal.value = true;
  }
};

const deleteBulkEntities = async () => {
  try {
    showDeleteModal.value = false;
    progressData.value = { current: 0, total: selectedEntities.value.length, operation: `Deleting ${props.entityName} records` };
    showProgressModal.value = true;
    
    for (let i = 0; i < selectedEntities.value.length; i++) {
      progressData.value.current = i + 1;
      const entityId = selectedEntities.value[i];
      const input = { [props.idField]: entityId };
      await props.deleteFunction(input);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    selectedEntities.value = [];
    showProgressModal.value = false;
    await loadEntities();
    
    successMessage.value = `Successfully deleted ${progressData.value.total} record(s)`;
    showSuccessModal.value = true;
    
    if (props.comparisonMode) {
      emit('recordUpdated', { deleted: true });
    }
  } catch (error) {
    showProgressModal.value = false;
    handleError(error, `deleting ${props.entityName}`);
  }
};

const toggleSelectAll = () => toggleSelectAllItems();

const sortBy = (field) => {
  if (sortField.value === field) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortField.value = field;
    sortDirection.value = 'asc';
  }
  applyFilters();
  
  if (props.comparisonMode === 'primary') {
    emit('sortChanged', { type: 'sort', field: sortField.value, direction: sortDirection.value });
  };
};

const applyFilters = () => {
  let filtered = entities.value.filter(entity => {
    const fieldsToCheck = props.comparisonMode ? (entityConfig.value.comparisonConfig?.comparisonFields || entityConfig.value.comparisonFields || props.fields) : filteredFields.value;
    return fieldsToCheck.every(field => {
      const filterValue = filters.value[field];
      if (!filterValue) return true;
      const entityValue = String(entity[field] || '').toLowerCase();
      return entityValue.includes(filterValue.toLowerCase());
    });
  });
  
  if (sortField.value) {
    filtered.sort((a, b) => {
      const aVal = String(a[sortField.value] || '').toLowerCase();
      const bVal = String(b[sortField.value] || '').toLowerCase();
      const comparison = aVal.localeCompare(bVal);
      return sortDirection.value === 'asc' ? comparison : -comparison;
    });
  }
  
  filteredEntities.value = filtered;
  
  if (props.comparisonMode === 'primary') {
    emit('filterChanged', { type: 'filter', filters: filters.value });
  }
};

const clearFilters = () => {
  filters.value = {};
  applyFilters();
};

const updateFilter = (field, value) => {
  filters.value[field] = value;
  applyFilters();
};

const toggleSelection = (entityId) => {
  const index = selectedEntities.value.indexOf(entityId);
  if (index > -1) {
    selectedEntities.value.splice(index, 1);
  } else {
    selectedEntities.value.push(entityId);
  }
};

const handleServiceChange = async (serviceId) => {
  selectedServiceFilter.value = String(serviceId);
  
  // Auto-fill form if creating and config allows it
  if (showCreateModal.value && entityConfig.value.autoFillFromFilter?.filterField === 'selectedServiceFilter') {
    formData.value[entityConfig.value.autoFillFromFilter.formField] = parseInt(serviceId);
  }
};

const handleProductChange = async (productId) => {
  selectedProductFilter.value = String(productId);
  
  // Auto-fill form if creating and config allows it
  if (showCreateModal.value && entityConfig.value.autoFillFromFilter?.filterField === 'selectedProductFilter') {
    formData.value[entityConfig.value.autoFillFromFilter.formField] = parseInt(productId);
  }
  
  // Trigger filtering for REDIRECT_URL
  if (props.entityName === 'REDIRECT_URL' && productId) {
    const filteredItems = allEntities.value.filter(item => 
      item.ORIGIN_PRODUCT_ID === parseInt(productId)
    );
    handleEntitiesFiltered(filteredItems);
  }
};

const handleOptionsLoaded = (data) => {
  if (data.type === 'service') {
    serviceOptions.value = data.options;
  } else if (data.type === 'product') {
    productOptions.value = data.options;
  }
};

const handleVendorNamesLoaded = (names) => {
  vendorNames.value = names;
};

const handleEntitiesFiltered = (filteredItems) => {
  entities.value = filteredItems;
  filteredEntities.value = filteredItems;
  applyFilters();
};

const handleFormProcessed = (data) => {
  // Form processing handled by EntityFormProcessor
};

const loadUserProfile = async () => {
  try {
    const attributes = await fetchUserAttributes();
    const profileValue = attributes.profile;
    if (profileValue && !isNaN(parseInt(profileValue))) {
      userProfileId.value = parseInt(profileValue);
    }
  } catch (error) {
    console.error('Failed to load user profile:', error);
  }
};

const enhanceWithForeignKeys = async (items) => {
  const config = entityConfig.value;
  if (!config.foreignKeys) return items;
  
  try {
    const { getClient } = await import('../client.js');
    
    // Load foreign key data for each configured relationship
    for (const [fieldName, fkConfig] of Object.entries(config.foreignKeys)) {
      const queryName = `list${fkConfig.table.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join('')}s`;
      const listName = `list${fkConfig.table}S`;
      
      if (queries[queryName]) {
        const result = await getClient().graphql({ query: queries[queryName] });
        const foreignItems = result.data[listName]?.items || [];
        
        // Create lookup map
        const lookupMap = new Map();
        foreignItems.forEach(item => {
          lookupMap.set(item[fkConfig.valueField], item[fkConfig.displayField]);
        });
        
        foreignKeyLookups.value.set(fieldName, lookupMap);
      }
    }
    
    // Enhance items with foreign key display values
    return items.map(item => {
      const enhancedItem = { ...item };
      
      Object.keys(config.foreignKeys).forEach(fieldName => {
        const fkConfig = config.foreignKeys[fieldName];
        const lookupMap = foreignKeyLookups.value.get(fieldName);
        
        if (lookupMap && enhancedItem[fieldName]) {
          const displayValue = lookupMap.get(enhancedItem[fieldName]);
          if (displayValue) {
            enhancedItem[`${fieldName}_DISPLAY`] = `${enhancedItem[fieldName]}: ${displayValue}`;
          }
        }
      });
      
      return enhancedItem;
    });
  } catch (error) {
    console.error('Failed to enhance with foreign keys:', error);
    return items;
  }
};

const loadRelationshipCounts = async () => {
  const relationships = entityConfig.value.relationships;
  if (!relationships) return;
  
  try {
    const { getClient } = await import('../client.js');
    
    for (const [relationKey, config] of Object.entries(relationships)) {
      const result = await getClient().graphql({ query: queries[config.query] });
      const items = result.data[config.dataKey]?.items || [];
      const counts = new Map();
      
      items.forEach(item => {
        config.countFields.forEach(field => {
          const id = item[field];
          if (id) counts.set(id, (counts.get(id) || 0) + 1);
        });
      });
      
      relationshipCounts.value.set(relationKey, counts);
    }
  } catch (error) {
    console.error('Failed to load relationship counts:', error);
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

const handleEscapeKey = (event) => {
  if (event.key === 'Escape') {
    if (showCreateModal.value) {
      showCreateModal.value = false;
      formData.value = {};
    } else if (showEditModal.value) {
      showEditModal.value = false;
      formData.value = {};
    } else if (showDeleteModal.value) {
      showDeleteModal.value = false;
    }
  }
};

const getDifferentFields = (entity) => {
  if (!props.fieldDifferences || !entity) return [];
  
  const entityId = getEntityId(entity);
  
  if (props.comparisonMode === 'primary') {
    const diffInfo = props.fieldDifferences.get(entityId);
    return diffInfo ? diffInfo.differentFields : [];
  } else {
    for (const [primaryId, info] of props.fieldDifferences.entries()) {
      if (info.compareId === entityId) {
        return info.differentFields;
      }
    }
  }
  
  return [];
};

const confirmCopy = () => {
  emit('copyDifferencesToOther', copyData.value);
  showCopyModal.value = false;
  copyData.value = null;
};

const cancelCopy = () => {
  showCopyModal.value = false;
  copyData.value = null;
};

// Helper methods for ActionButtons
const isRecordMatched = (entity) => {
  if (!props.comparisonMode || !props.fieldDifferences) return false;
  
  const entityId = getEntityId(entity);
  
  if (props.comparisonMode === 'primary') {
    return props.fieldDifferences.has(entityId);
  } else {
    for (const [primaryId, info] of props.fieldDifferences.entries()) {
      if (info.compareId === entityId) {
        return true;
      }
    }
  }
  
  return false;
};

const hasFieldDifferences = (entity) => {
  if (!props.comparisonMode || !props.fieldDifferences) return false;
  
  const entityId = getEntityId(entity);
  
  if (props.comparisonMode === 'primary') {
    const diffInfo = props.fieldDifferences.get(entityId);
    return diffInfo && diffInfo.differentFields.length > 0;
  } else {
    for (const [primaryId, info] of props.fieldDifferences.entries()) {
      if (info.compareId === entityId && info.differentFields.length > 0) {
        return true;
      }
    }
  }
  
  return false;
};

const getRelationshipCount = (entity, relationKey) => {
  const counts = relationshipCounts.value.get(relationKey);
  return counts ? counts.get(getEntityId(entity)) || 0 : 0;
};

const getMappingCount = (entity) => getRelationshipCount(entity, 'mappings');
const getRedirectUrlCount = (entity) => getRelationshipCount(entity, 'redirectUrls');
const getParameterCount = (entity) => getRelationshipCount(entity, 'parameters');
const getStepMappingCount = (entity) => getRelationshipCount(entity, 'stepMappings');
const getStepServiceCount = (entity) => getRelationshipCount(entity, 'stepServices');
const getOtherEnvironmentName = () => props.otherEnvironment?.toUpperCase() || '';

// Action button handlers
const addToOtherEnvironment = (entity) => emit('addToOtherEnvironment', { entity, targetEnvironment: props.otherEnvironment });
const copyDifferencesToOther = (entity) => {
  copyData.value = { entity, targetEnvironment: props.otherEnvironment };
  showCopyModal.value = true;
};

const showParameterMappings = async (entity) => {
  try {
    const paramId = entity.SERVICE_PARAM_ID;
    const { getClient } = await import('../client.js');
    
    const [mappingsResult, productsResult, servicesResult, paramsResult] = await Promise.all([
      getClient().graphql({ query: queries.listServiceParamMappings }),
      getClient().graphql({ query: queries.listOriginProducts }),
      getClient().graphql({ query: queries.listServices }),
      getClient().graphql({ query: queries.listServiceParams })
    ]);
    
    const allMappings = mappingsResult.data.listSERVICE_PARAM_MAPPINGS?.items || [];
    const products = productsResult.data.listORIGIN_PRODUCTS?.items || [];
    const services = servicesResult.data.listSERVICES?.items || [];
    const serviceParams = paramsResult.data.listSERVICE_PARAMS?.items || [];
    
    const paramMappings = allMappings.filter(mapping => 
      mapping.SOURCE_SERVICE_PARAM_ID === paramId || mapping.TARGET_SERVICE_PARAM_ID === paramId
    );
    
    const enhancedMappings = paramMappings.map(mapping => {
      const product = products.find(p => p.ORIGIN_PRODUCT_ID === mapping.ORIGIN_PRODUCT_ID);
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
    selectedParamName.value = entity.PARAM_NAME;
    showMappingsModal.value = true;
  } catch (error) {
    handleError(error, 'loading parameter mappings');
  }
};

const openMapping = (entity) => emit('openMapping', { productId: entity.ORIGIN_PRODUCT_ID });
const openRedirectUrls = (entity) => emit('openRedirectUrls', { productId: entity.ORIGIN_PRODUCT_ID });
const openStepServices = (entity) => emit('openStepServices', { stepTypeId: entity.STEP_TYPE_ID });
const openServiceParams = (entity) => emit('openServiceParams', { serviceId: entity.SERVICE_ID });
const openServiceStepMapping = (entity) => emit('openServiceStepMapping', { serviceId: entity.SERVICE_ID });

const getIntegratedFilterOptions = (filterConfig) => {
  // Handle cascading dropdowns for service params
  if (filterConfig.dependsOn) {
    const parentValue = helperFilterData.value[filterConfig.dependsOn];
    if (!parentValue) return [];
    
    // Filter params by selected service
    const serviceParams = window.serviceParams || [];
    const filteredParams = serviceParams.filter(p => p.SERVICE_ID === parseInt(parentValue));
    return filteredParams.map(p => ({ value: p.SERVICE_PARAM_ID, label: `${p.SERVICE_PARAM_ID}: ${p.PARAM_NAME}` }));
  }
  
  // Handle service filtering based on selected product and available mappings
  if (filterConfig.filterField.includes('SERVICE_ID') && props.entityName === 'STEP_TYPE_PARAM_MAP') {
    const selectedProductId = helperFilterData.value.FILTER_PRODUCT_ID;
    if (!selectedProductId) return [];
    
    // Get services that have mappings for the selected product
    const relevantMappings = allServiceParamMappings.value.filter(m => 
      m.ORIGIN_PRODUCT_ID === parseInt(selectedProductId)
    );
    
    const serviceIds = new Set();
    relevantMappings.forEach(mapping => {
      const sourceParam = window.serviceParams?.find(p => p.SERVICE_PARAM_ID === mapping.SOURCE_SERVICE_PARAM_ID);
      const targetParam = window.serviceParams?.find(p => p.SERVICE_PARAM_ID === mapping.TARGET_SERVICE_PARAM_ID);
      
      if (filterConfig.filterField.includes('SOURCE') && sourceParam) {
        serviceIds.add(sourceParam.SERVICE_ID);
      }
      if (filterConfig.filterField.includes('TARGET') && targetParam) {
        serviceIds.add(targetParam.SERVICE_ID);
      }
    });
    
    const lookupMap = foreignKeyLookups.value.get(filterConfig.filterField);
    if (lookupMap) {
      return Array.from(serviceIds).map(serviceId => {
        const display = lookupMap.get(serviceId);
        return { value: serviceId, label: `${serviceId}: ${display}` };
      });
    }
  }
  
  // Regular dropdown
  const lookupMap = foreignKeyLookups.value.get(filterConfig.filterField);
  if (lookupMap) {
    return Array.from(lookupMap.entries()).map(([value, display]) => ({
      value,
      label: `${value}: ${display}`
    }));
  }
  return [];
};

const filterIntegratedOptions = (fieldName) => {
  // This will trigger reactivity for the parameter dropdown options
  // The getFieldOptions method will handle filtering based on selected service
};

const enhanceServiceParamMappingDisplay = async (items) => {
  try {
    return items.map(item => {
      if (item.SERVICE_PARAM_MAPPING_ID) {
        const mapping = allServiceParamMappings.value.find(m => 
          m.SERVICE_PARAM_MAPPING_ID === item.SERVICE_PARAM_MAPPING_ID
        );
        if (mapping) {
          return {
            ...item,
            SERVICE_PARAM_MAPPING_ID_DISPLAY: `${mapping.SERVICE_PARAM_MAPPING_ID}: ${mapping.PRODUCT_ID || 'N/A'} - ${mapping.SOURCE_PARAM || 'N/A'} → ${mapping.TARGET_PARAM || 'N/A'}`
          };
        }
      }
      return item;
    });
  } catch (error) {
    console.error('Failed to enhance service param mapping display:', error);
    return items;
  }
};

const loadIntegratedFilterData = async () => {
  try {
    const { getClient } = await import('../client.js');
    const client = getClient();
    
    const [servicesResult, paramsResult] = await Promise.all([
      client.graphql({ query: queries.listServices }),
      client.graphql({ query: queries.listServiceParams })
    ]);
    
    const services = servicesResult.data.listSERVICES?.items || [];
    const params = paramsResult.data.listSERVICE_PARAMS?.items || [];
    
    // Create lookup maps for integrated filters
    const serviceLookup = new Map();
    services.forEach(s => serviceLookup.set(s.SERVICE_ID, s.URI));
    foreignKeyLookups.value.set('SOURCE_SERVICE_ID', serviceLookup);
    foreignKeyLookups.value.set('TARGET_SERVICE_ID', serviceLookup);
    
    const paramLookup = new Map();
    params.forEach(p => paramLookup.set(p.SERVICE_PARAM_ID, p.PARAM_NAME));
    foreignKeyLookups.value.set('SOURCE_SERVICE_PARAM_ID', paramLookup);
    foreignKeyLookups.value.set('TARGET_SERVICE_PARAM_ID', paramLookup);
    
    // Store params with service relationship for filtering
    window.serviceParams = params;
    
    // Also create lookups for STEP_TYPE_PARAM_MAP filters
    if (props.entityName === 'STEP_TYPE_PARAM_MAP') {
      const productsResult = await client.graphql({ query: queries.listOriginProducts });
      const products = productsResult.data.listORIGIN_PRODUCTS?.items || [];
      
      const productLookup = new Map();
      products.forEach(p => productLookup.set(p.ORIGIN_PRODUCT_ID, p.PRODUCT_ID));
      foreignKeyLookups.value.set('FILTER_PRODUCT_ID', productLookup);
      
      // Reuse service and param lookups with filter prefixes
      foreignKeyLookups.value.set('FILTER_SOURCE_SERVICE_ID', serviceLookup);
      foreignKeyLookups.value.set('FILTER_TARGET_SERVICE_ID', serviceLookup);
      foreignKeyLookups.value.set('FILTER_SOURCE_PARAM_ID', paramLookup);
      foreignKeyLookups.value.set('FILTER_TARGET_PARAM_ID', paramLookup);
    }
  } catch (error) {
    console.error('Failed to load integrated filter data:', error);
  }
};



const getFieldOptions = (field) => {
  if (field.name === 'SERVICE_PARAM_MAPPING_ID') {
    // For STEP_TYPE_PARAM_MAP, filter by selected product
    if (props.entityName === 'STEP_TYPE_PARAM_MAP') {
      const selectedProductId = helperFilterData.value.FILTER_PRODUCT_ID;
      let mappingsToShow = allServiceParamMappings.value;
      
      if (selectedProductId) {
        mappingsToShow = allServiceParamMappings.value.filter(m => 
          m.ORIGIN_PRODUCT_ID === parseInt(selectedProductId)
        );
      }
      
      // Further filter by selected services and params if specified
      const sourceServiceId = helperFilterData.value.FILTER_SOURCE_SERVICE_ID;
      const targetServiceId = helperFilterData.value.FILTER_TARGET_SERVICE_ID;
      const sourceParamId = helperFilterData.value.FILTER_SOURCE_PARAM_ID;
      const targetParamId = helperFilterData.value.FILTER_TARGET_PARAM_ID;
      
      if (sourceServiceId || targetServiceId || sourceParamId || targetParamId) {
        mappingsToShow = mappingsToShow.filter(mapping => {
          let matches = true;
          
          if (sourceParamId) {
            matches = matches && mapping.SOURCE_SERVICE_PARAM_ID === parseInt(sourceParamId);
          } else if (sourceServiceId) {
            const sourceParam = window.serviceParams?.find(p => p.SERVICE_PARAM_ID === mapping.SOURCE_SERVICE_PARAM_ID);
            matches = matches && sourceParam?.SERVICE_ID === parseInt(sourceServiceId);
          }
          
          if (targetParamId) {
            matches = matches && mapping.TARGET_SERVICE_PARAM_ID === parseInt(targetParamId);
          } else if (targetServiceId) {
            const targetParam = window.serviceParams?.find(p => p.SERVICE_PARAM_ID === mapping.TARGET_SERVICE_PARAM_ID);
            matches = matches && targetParam?.SERVICE_ID === parseInt(targetServiceId);
          }
          
          return matches;
        });
      }
      
      return mappingsToShow.map(mapping => ({
        value: mapping.SERVICE_PARAM_MAPPING_ID,
        label: `${mapping.SERVICE_PARAM_MAPPING_ID}: ${mapping.PRODUCT_ID || 'N/A'} - ${mapping.SOURCE_PARAM || 'N/A'} → ${mapping.TARGET_PARAM || 'N/A'}`
      }));
    }
    
    // For SERVICE_PARAM_MAPPING entity itself
    return filteredServiceParamMappings.value.map(mapping => ({
      value: mapping.SERVICE_PARAM_MAPPING_ID,
      label: `${mapping.SERVICE_PARAM_MAPPING_ID}: ${mapping.PRODUCT_ID || 'N/A'} - ${mapping.SOURCE_PARAM || 'N/A'} → ${mapping.TARGET_PARAM || 'N/A'}`
    }));
  }
  
  // Handle integrated filtered parameter fields
  if (entityConfig.value.integratedFilters && entityConfig.value.integratedFilters[field.name]) {
    const filterConfig = entityConfig.value.integratedFilters[field.name];
    const selectedServiceId = helperFilterData.value[filterConfig.filterField];
    
    if (!selectedServiceId) return [];
    
    // Filter service params by selected service
    const allParams = Array.from(foreignKeyLookups.value.get(field.name)?.entries() || []);
    const serviceParams = window.serviceParams || [];
    const filteredParams = serviceParams.filter(p => p.SERVICE_ID === parseInt(selectedServiceId));
    
    return filteredParams.map(p => ({
      value: p.SERVICE_PARAM_ID,
      label: `${p.SERVICE_PARAM_ID}: ${p.PARAM_NAME}`
    }));
  }
  
  return field.options || [];
};

const filterServiceParamMappings = () => {
  if (!allServiceParamMappings.value.length) {
    filteredServiceParamMappings.value = [];
    return;
  }
  
  let filtered = [...allServiceParamMappings.value];
  
  // Apply filters using the updated field names
  if (helperFilterData.value.ORIGIN_PRODUCT_ID) {
    filtered = filtered.filter(m => m.ORIGIN_PRODUCT_ID === parseInt(helperFilterData.value.ORIGIN_PRODUCT_ID));
  }
  if (helperFilterData.value.SOURCE_SERVICE_ID) {
    filtered = filtered.filter(m => m.SOURCE_SERVICE_ID === parseInt(helperFilterData.value.SOURCE_SERVICE_ID));
  }
  if (helperFilterData.value.SOURCE_PARAM_ID) {
    filtered = filtered.filter(m => m.SOURCE_SERVICE_PARAM_ID === parseInt(helperFilterData.value.SOURCE_PARAM_ID));
  }
  if (helperFilterData.value.TARGET_SERVICE_ID) {
    filtered = filtered.filter(m => m.TARGET_SERVICE_ID === parseInt(helperFilterData.value.TARGET_SERVICE_ID));
  }
  if (helperFilterData.value.TARGET_PARAM_ID) {
    filtered = filtered.filter(m => m.TARGET_SERVICE_PARAM_ID === parseInt(helperFilterData.value.TARGET_PARAM_ID));
  }
  
  filteredServiceParamMappings.value = filtered;
};

const loadServiceParamMappingsForFiltering = async () => {
  if (props.entityName !== 'STEP_TYPE_PARAM_MAP') return;
  
  try {
    const { getClient } = await import('../client.js');
    const [mappingsResult, productsResult, servicesResult, paramsResult] = await Promise.all([
      getClient().graphql({ query: queries.listServiceParamMappings }),
      getClient().graphql({ query: queries.listOriginProducts }),
      getClient().graphql({ query: queries.listServices }),
      getClient().graphql({ query: queries.listServiceParams })
    ]);
    
    const mappings = mappingsResult.data.listSERVICE_PARAM_MAPPINGS?.items || [];
    const products = productsResult.data.listORIGIN_PRODUCTS?.items || [];
    const services = servicesResult.data.listSERVICES?.items || [];
    const params = paramsResult.data.listSERVICE_PARAMS?.items || [];
    
    // Create lookup maps for helper filters
    const productLookup = new Map();
    products.forEach(p => productLookup.set(p.ORIGIN_PRODUCT_ID, p.PRODUCT_ID));
    foreignKeyLookups.value.set('ORIGIN_PRODUCT_ID', productLookup);
    
    const serviceLookup = new Map();
    services.forEach(s => serviceLookup.set(s.SERVICE_ID, s.URI));
    foreignKeyLookups.value.set('SOURCE_SERVICE_ID', serviceLookup);
    foreignKeyLookups.value.set('TARGET_SERVICE_ID', serviceLookup);
    
    const paramLookup = new Map();
    params.forEach(p => paramLookup.set(p.SERVICE_PARAM_ID, p.PARAM_NAME));
    foreignKeyLookups.value.set('SOURCE_PARAM_ID', paramLookup);
    foreignKeyLookups.value.set('TARGET_PARAM_ID', paramLookup);
    
    // Enhance mappings with readable information
    const enhancedMappings = mappings.map(mapping => {
      const product = products.find(p => p.ORIGIN_PRODUCT_ID === mapping.ORIGIN_PRODUCT_ID);
      const sourceParam = params.find(p => p.SERVICE_PARAM_ID === mapping.SOURCE_SERVICE_PARAM_ID);
      const targetParam = params.find(p => p.SERVICE_PARAM_ID === mapping.TARGET_SERVICE_PARAM_ID);
      const sourceService = sourceParam ? services.find(s => s.SERVICE_ID === sourceParam.SERVICE_ID) : null;
      const targetService = targetParam ? services.find(s => s.SERVICE_ID === targetParam.SERVICE_ID) : null;
      
      return {
        ...mapping,
        PRODUCT_ID: product?.PRODUCT_ID,
        SOURCE_PARAM: sourceParam?.PARAM_NAME,
        TARGET_PARAM: targetParam?.PARAM_NAME,
        SOURCE_SERVICE_ID: sourceService?.SERVICE_ID,
        TARGET_SERVICE_ID: targetService?.SERVICE_ID
      };
    });
    
    allServiceParamMappings.value = enhancedMappings;
    filteredServiceParamMappings.value = enhancedMappings;
  } catch (error) {
    console.error('Failed to load service param mappings for filtering:', error);
  }
};



// Add missing watchers
watch(selectedEntities, (newVal) => {
  emit('selectedCountChanged', newVal.length);
}, { deep: true });

watch(entities, (newVal) => {
  emit('entityCountChanged', newVal.length);
}, { deep: true });

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

watch(() => props.productFilter, (newFilter) => {
  if (props.entityName === 'REDIRECT_URL' && newFilter !== selectedProductFilter.value) {
    selectedProductFilter.value = newFilter;
    handleProductChange(newFilter);
  }
}, { immediate: true });

watch(() => props.serviceFilter, (newFilter) => {
  if (props.entityName === 'SERVICE_PARAM' && newFilter !== selectedServiceFilter.value) {
    selectedServiceFilter.value = newFilter;
    handleServiceChange(newFilter);
  }
}, { immediate: true });

onMounted(async () => {
  await loadUserProfile();
  await loadEntities();
  startEnvironmentWatcher();
  document.addEventListener('keydown', handleEscapeKey);
});

onUnmounted(() => {
  stopEnvironmentWatcher();
  window.removeEventListener('environmentChanged', handleEnvironmentChange);
  document.removeEventListener('keydown', handleEscapeKey);
  document.removeEventListener('mousemove', doResize);
  document.removeEventListener('mouseup', stopResize);
});

// Watch for create modal to set defaults
watch(showCreateModal, async (newVal) => {
  if (newVal) {
    const today = getCurrentDateString();
    
    // Reset helper filter data
    resetHelperFilters();
    
    // Only set fields that exist in the entity's formFields configuration
    const defaultData = { ...formData.value };
    
    // Check if entity has CREATED_DATE field
    if (props.formFields.some(field => field.name === 'CREATED_DATE')) {
      defaultData.CREATED_DATE = today;
    }
    
    // Check if entity has CREATED_BY_USER_ID field
    if (props.formFields.some(field => field.name === 'CREATED_BY_USER_ID')) {
      defaultData.CREATED_BY_USER_ID = userProfileId.value || 1;
    }
    
    // Ensure CHANGED fields are not set on CREATE
    delete defaultData.CHANGED_DATE;
    delete defaultData.CHANGED_BY_USER_ID;
    
    formData.value = defaultData;
    
    // Set parent ID if provided
    if (props.parentId && props.parentField) {
      formData.value[props.parentField] = props.parentId;
    }
    
    // Auto-fill from filter based on entity configuration
    if (entityConfig.value.autoFillFromFilter) {
      const { filterField, formField } = entityConfig.value.autoFillFromFilter;
      const filterValue = filterField === 'selectedServiceFilter' ? selectedServiceFilter.value : 
                         filterField === 'selectedProductFilter' ? selectedProductFilter.value : null;
      if (filterValue) {
        formData.value[formField] = parseInt(filterValue);
      }
    }
    
    // Set default values from form field configuration
    entityConfig.value.formFields?.forEach(field => {
      if (field.defaultValue !== undefined && formData.value[field.name] === undefined) {
        formData.value[field.name] = field.defaultValue;
      }
    });
    
    // Initialize filtered mappings for STEP_TYPE_PARAM_MAP
    if (props.entityName === 'STEP_TYPE_PARAM_MAP') {
      filterServiceParamMappings();
    }
    
    // Load helper filter data for entities that need it
    if (entityConfig.value.helperFilters || entityConfig.value.integratedFilters) {
      const { getClient } = await import('../client.js');
      if (entityConfig.value.helperFilters) {
        await loadHelperFilters(entityConfig.value, getClient());
      }
      if (entityConfig.value.integratedFilters) {
        await loadIntegratedFilterData();
      }
    }
  }
});

watch(() => props.entityName, async () => {
  // Reset filters when entity changes
  selectedServiceFilter.value = '';
  selectedProductFilter.value = '';
  selectedStepFilter.value = '';
  filters.value = {};
  selectedEntities.value = [];
  sortField.value = '';
  sortDirection.value = 'asc';
  
  await loadEntities();
});

// Watch for environment changes
const currentEnvironment = ref(localStorage.getItem('selectedEnvironment') || 'dev');
let environmentCheckInterval;

const handleEnvironmentChange = async () => {
  // Reload entity-specific data when environment changes
  await loadEntities();
};

const startEnvironmentWatcher = () => {
  environmentCheckInterval = setInterval(() => {
    const newEnv = localStorage.getItem('selectedEnvironment') || 'dev';
    if (newEnv !== currentEnvironment.value) {
      currentEnvironment.value = newEnv;
      handleEnvironmentChange();
    }
  }, 500);
};

const stopEnvironmentWatcher = () => {
  if (environmentCheckInterval) {
    clearInterval(environmentCheckInterval);
  }
};

window.addEventListener('environmentChanged', handleEnvironmentChange);

defineExpose({
  loadEntities,
  showCreateModal,
  confirmBulkDelete,
  selectedProductFilter,
  selectedServiceFilter,
  filterByProduct: () => handleProductChange(selectedProductFilter.value),
  filterByService: () => handleServiceChange(selectedServiceFilter.value)
});
</script>

<style scoped>
.integrated-filter {
  margin-top: 8px;
  margin-left: 20px;
  margin-right: 20px;
}


.entity-manager {
  width: 100%;
  height: calc(100vh - 250px);
  padding: 20px;
  overflow: hidden;
  background-color: var(--bg-color);
  color: var(--text-color);
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

.action-buttons {
  display: flex;
  gap: 10px;
  align-items: center;
}

.record-count {
  margin-left: auto;
  font-weight: bold;
}

.form-group {
  margin-bottom: 10px;
}

label {
  display: block;
  margin-bottom: 5px;
}

input, select {
  width: 100%;
  padding: 8px;
  box-sizing: border-box;
  background-color: var(--input-bg);
  color: var(--text-color);
  border: 1px solid var(--border-color);
}

button {
  padding: 8px 12px;
  cursor: pointer;
  border: none;
  border-radius: 4px;
}

.btn-primary { background: #007bff; color: white; }
.btn-success { background: #28a745; color: white; }
.btn-danger { background: #dc3545; color: white; }
</style>