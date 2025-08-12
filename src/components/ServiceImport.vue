<template>
  <div class="service-import">
    <h2>Import Services from OpenAPI</h2>
    
    <!-- File Upload Section -->
    <div class="upload-section">
      <input 
        type="file" 
        @change="handleFileUpload" 
        accept=".yaml,.yml,.json"
        ref="fileInput"
      />
      <button @click="parseFile" :disabled="!selectedFile || loading">
        {{ loading ? 'Parsing...' : 'Parse OpenAPI File' }}
      </button>
    </div>

    <!-- Error Display -->
    <div v-if="error" class="error">
      {{ error }}
    </div>

    <!-- Service Selection -->
    <div v-if="parsedServices.length > 0" class="service-selection">
      <h3>Select Service:</h3>
      <select v-model="selectedService" @change="onServiceSelect">
        <option value="">-- Select a Service --</option>
        <option v-for="service in parsedServices" :key="service.path + service.method" :value="service">
          {{ service.method.toUpperCase() }} {{ service.path }} - {{ service.summary }}
        </option>
      </select>
    </div>

    <!-- Service Details -->
    <div v-if="selectedService" class="service-details">
      <!-- Action Buttons -->
      <div class="sticky-buttons">
        <button 
          v-if="!serviceExists" 
          @click="insertService" 
          :disabled="saving"
          class="btn-primary"
        >
          {{ saving ? 'Inserting...' : 'Insert Service' }}
        </button>
        <button 
          v-if="serviceExists" 
          @click="updateService" 
          :disabled="saving"
          class="btn-primary"
        >
          {{ saving ? 'Updating...' : 'Update Parameters' }}
        </button>
        <button @click="addCustomParam('request')" class="btn-success">
          Add Custom Parameter
        </button>
      </div>
      
      <h3>Service: {{ selectedService.method.toUpperCase() }} {{ selectedService.path }}</h3>
      
      <!-- Request Parameters Table -->
      <div class="parameters-section">
        <h4>Request Parameters</h4>
        <table class="params-table">
          <thead>
            <tr>
              <th class="w-12">
                <input type="checkbox" @change="toggleSelectAll" :checked="allSelected" />
              </th>
              <th class="sortable" @click="sortBy('name')">
                Parameter Name
                <span v-if="sortField === 'name'" class="sort-indicator">
                  {{ sortDirection === 'asc' ? '↑' : '↓' }}
                </span>
              </th>
              <th class="sortable" @click="sortBy('type')">
                Type
                <span v-if="sortField === 'type'" class="sort-indicator">
                  {{ sortDirection === 'asc' ? '↑' : '↓' }}
                </span>
              </th>
              <th class="sortable" @click="sortBy('description')">
                Description
                <span v-if="sortField === 'description'" class="sort-indicator">
                  {{ sortDirection === 'asc' ? '↑' : '↓' }}
                </span>
              </th>
              <th>Actions</th>
            </tr>
            <tr class="filter-row">
              <th></th>
              <th>
                <input 
                  v-model="filters.name" 
                  @input="applyFilters"
                  placeholder="Filter name"
                  class="filter-input"
                />
              </th>
              <th>
                <input 
                  v-model="filters.type" 
                  @input="applyFilters"
                  placeholder="Filter type"
                  class="filter-input"
                />
              </th>
              <th>
                <input 
                  v-model="filters.description" 
                  @input="applyFilters"
                  placeholder="Filter description"
                  class="filter-input"
                />
              </th>
              <th>
                <button @click="clearFilters" class="clear-filters-btn">Clear</button>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(param, index) in filteredParams" :key="index" :class="{ 'existing': param.exists }">
              <td class="text-center w-12">
                <input 
                  type="checkbox" 
                  v-model="param.import" 
                  :disabled="param.exists"
                  class="h-4 w-4"
                />
              </td>
              <td class="w-72">
                <input 
                  v-model="param.name" 
                  :disabled="param.exists || !param.custom"
                  :class="{ 'disabled': param.exists || !param.custom }"
                  class="w-full"
                />
              </td>
              <td class="w-18">
                <select 
                  v-model="param.type" 
                  :disabled="param.exists || !param.custom"
                  :class="{ 'disabled': param.exists || !param.custom }"
                  class="w-full text-xs"
                >
                  <option value="string">string</option>
                  <option value="number">number</option>
                  <option value="integer">integer</option>
                  <option value="boolean">boolean</option>
                  <option value="array">array</option>
                  <option value="object">object</option>
                  <option value="file">file</option>
                </select>
              </td>

              <td class="w-desc">
                <textarea 
                  v-model="param.description" 
                  :disabled="param.exists || !param.custom"
                  :class="{ 'disabled': param.exists || !param.custom }"
                  class="w-full resize-none"
                  rows="2"
                ></textarea>
              </td>
              <td class="text-center w-10">
                <button v-if="!param.exists && param.custom" @click="removeCustomParam(index, 'request')" class="text-red-600 hover:text-red-800">
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Response Parameters Table -->
      <div class="parameters-section" style="display: none;">
        <h4>Response Parameters</h4>
        <table class="params-table">
          <thead>
            <tr>
              <th class="w-12">Import</th>
              <th class="w-72">Parameter Name</th>
              <th class="w-18">Type</th>
              <th class="w-desc">Description</th>
              <th class="w-10">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(param, index) in responseParams" :key="index" :class="{ 'existing': param.exists }">
              <td class="text-center w-12">
                <input 
                  type="checkbox" 
                  v-model="param.import" 
                  class="h-4 w-4"
                />
              </td>
              <td class="w-72">
                <input 
                  v-model="param.name" 
                  :disabled="param.exists || !param.custom"
                  :class="{ 'disabled': param.exists || !param.custom }"
                  class="w-full"
                />
              </td>
              <td class="w-18">
                <select 
                  v-model="param.type" 
                  :disabled="param.exists || !param.custom"
                  :class="{ 'disabled': param.exists || !param.custom }"
                  class="w-full text-xs"
                >
                  <option value="string">string</option>
                  <option value="number">number</option>
                  <option value="integer">integer</option>
                  <option value="boolean">boolean</option>
                  <option value="array">array</option>
                  <option value="object">object</option>
                  <option value="file">file</option>
                </select>
              </td>
              <td class="w-desc">
                <textarea 
                  v-model="param.description" 
                  :disabled="param.exists || !param.custom"
                  :class="{ 'disabled': param.exists || !param.custom }"
                  class="w-full resize-none"
                  rows="2"
                ></textarea>
              </td>
              <td class="text-center w-10">
                <button v-if="!param.exists && param.custom" @click="removeCustomParam(index, 'response')" class="text-red-600 hover:text-red-800">
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <button @click="addCustomParam('response')" class="add-param-btn">
          Add Custom Parameter
        </button>
      </div>


    </div>

    <!-- Progress Modal -->
    <div v-if="showProgressModal" class="modal-overlay">
      <div class="modal-content">
        <h3>Inserting Parameters</h3>
        <p>Inserting {{ currentInsert }} of {{ totalInserts }} records</p>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
        </div>
      </div>
    </div>
    
    <!-- Success Modal -->
    <div v-if="showSuccessModal" class="modal-overlay">
      <div class="modal-content">
        <h3>Success</h3>
        <p>Service and parameters inserted successfully!</p>
        <div class="form-actions">
          <button @click="closeSuccessModal" class="btn-primary">OK</button>
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
import { ref, computed } from 'vue';
import { Buffer } from 'buffer';
import SwaggerParser from '@apidevtools/swagger-parser';
import { generateClient } from 'aws-amplify/api';

// Make Buffer available globally for SwaggerParser
if (typeof window !== 'undefined') {
  (window as any).Buffer = Buffer;
}
import * as queries from '../graphql/queries';
import * as mutations from '../graphql/mutations';
import { createServiceBatch, createServiceParamBatch } from '../graphql.ts';

const client = generateClient();

// Reactive data
const selectedFile = ref<File | null>(null);
const loading = ref(false);
const saving = ref(false);
const error = ref('');
const parsedServices = ref<any[]>([]);
const selectedService = ref<any>(null);
const requestParams = ref<any[]>([]);
const responseParams = ref<any[]>([]);
const serviceExists = ref(false);
const existingServiceId = ref<number | null>(null);
const showProgressModal = ref(false);
const showSuccessModal = ref(false);
const showErrorModal = ref(false);
const errorMessage = ref('');
const currentInsert = ref(0);
const totalInserts = ref(0);
const progressPercentage = computed(() => 
  totalInserts.value > 0 ? (currentInsert.value / totalInserts.value) * 100 : 0
);
const allSelected = computed(() => 
  requestParams.value.length > 0 && requestParams.value.every(param => param.import)
);
const sortField = ref('');
const sortDirection = ref('asc');
const filters = ref({ name: '', type: '', description: '' });
const filteredParams = ref([]);

// File handling
const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    selectedFile.value = target.files[0];
    error.value = '';
  }
};



// Parse OpenAPI file
const parseFile = async () => {
  if (!selectedFile.value) return;
  
  loading.value = true;
  error.value = '';
  
  try {
    const fileContent = await selectedFile.value.text();
    
    // Parse content to object first
    let parsedSpec;
    if (selectedFile.value.name.endsWith('.json')) {
      parsedSpec = JSON.parse(fileContent);
    } else {
      // Use dynamic import for js-yaml to avoid build issues
      const { load } = await import('js-yaml');
      parsedSpec = load(fileContent) as any;
    }
    
    // Use SwaggerParser.dereference to resolve all $refs
    const api = await SwaggerParser.dereference(parsedSpec);
    
    // Extract services
    const services: any[] = [];
    Object.entries(api.paths).forEach(([path, methods]: [string, any]) => {
      Object.entries(methods).forEach(([method, operation]: [string, any]) => {
        if (typeof operation === 'object' && operation !== null) {
          services.push({
            path,
            method: method.toUpperCase(),
            operationId: operation.operationId || `${method}_${path.replace(/[^a-zA-Z0-9]/g, '_')}`,
            summary: operation.summary || '',
            description: operation.description || '',
            parameters: operation.parameters || [],
            requestBody: operation.requestBody,
            responses: operation.responses || {}
          });
        }
      });
    });
    
    if (services.length === 0) {
      throw new Error('No valid operations found in OpenAPI specification');
    }
    
    parsedServices.value = services;
  } catch (err: any) {
    error.value = `Failed to parse OpenAPI file: ${err.message}`;
  } finally {
    loading.value = false;
  }
};

// Service selection
const onServiceSelect = async () => {
  if (!selectedService.value) return;
  
  // Extract request parameters
  const reqParams = extractRequestParameters(selectedService.value);
  const respParams = extractResponseParameters(selectedService.value);
  
  // Check if service exists
  await checkServiceExists();
  
  // Check which parameters already exist
  if (serviceExists.value) {
    await checkExistingParameters(reqParams, respParams);
  }
  
  requestParams.value = reqParams;
  responseParams.value = respParams;
  applyFilters();
};

// Extract request parameters from OpenAPI spec
const extractRequestParameters = (service: any) => {
  const params: any[] = [];
  
  // Path parameters
  if (service.parameters) {
    service.parameters.forEach((param: any) => {
      params.push({
        name: `$.${param.name}`,
        type: param.schema?.type || 'string',
        required: param.required || false,
        description: param.description || '',
        location: param.in,
        exists: false,
        custom: false,
        import: true
      });
    });
  }
  
  // Request body parameters
  if (service.requestBody?.content?.['application/json']?.schema) {
    const schema = service.requestBody.content['application/json'].schema;
    extractSchemaProperties(schema, params, 'body');
  }
  
  return params;
};

// Extract response parameters from OpenAPI spec
const extractResponseParameters = (service: any) => {
  const params: any[] = [];
  
  // Extract from 200 response
  const successResponse = service.responses?.['200'];
  if (successResponse?.content?.['application/json']?.schema) {
    const schema = successResponse.content['application/json'].schema;
    extractSchemaProperties(schema, params, 'response');
  }
  
  return params;
};

// Extract properties from schema (SwaggerParser resolved all $refs)
const extractSchemaProperties = (schema: any, params: any[], location: string, prefix = '', visited = new Set()) => {
  if (!schema) return;
  
  // Prevent infinite recursion
  const schemaKey = `${JSON.stringify(schema)}_${prefix}`;
  if (visited.has(schemaKey)) {
    params.push({
      name: `$.${prefix || 'circular'}`,
      type: 'object',
      required: false,
      description: 'Circular reference detected',
      location,
      exists: false,
      custom: false,
      import: true
    });
    return;
  }
  visited.add(schemaKey);
  
  // Handle oneOf, anyOf, allOf
  if (schema.oneOf || schema.anyOf || schema.allOf) {
    const variants = schema.oneOf || schema.anyOf || schema.allOf;
    variants.forEach((variant: any, index: number) => {
      const variantPrefix = prefix ? `${prefix}.variant${index}` : `variant${index}`;
      extractSchemaProperties(variant, params, location, variantPrefix, visited);
    });
    visited.delete(schemaKey);
    return;
  }
  
  if (schema.properties) {
    Object.entries(schema.properties).forEach(([name, prop]: [string, any]) => {
      const fullName = prefix ? `${prefix}.${name}` : name;
      
      params.push({
        name: `$.${fullName}`,
        type: prop.type || (prop.properties ? 'object' : 'string'),
        required: schema.required?.includes(name) || false,
        description: prop.description || '',
        location,
        exists: false,
        custom: false,
        import: true
      });
      
      // Recursively handle nested objects
      if (prop.type === 'object' && prop.properties) {
        extractSchemaProperties(prop, params, location, fullName, visited);
      } else if (prop.type === 'array' && prop.items && prop.items.properties) {
        extractSchemaProperties(prop.items, params, location, `${fullName}[]`, visited);
      }
    });
  } else if (schema.type === 'array' && schema.items && schema.items.properties) {
    const itemName = prefix || 'items';
    extractSchemaProperties(schema.items, params, location, `${itemName}[]`, visited);
  }
  
  visited.delete(schemaKey);
};

// Check if service exists in database
const checkServiceExists = async () => {
  try {
    const result = await client.graphql({ query: queries.listServices });
    const services = result.data.listSERVICES.items;
    
    const existing = services.find((s: any) => 
      s.URI === selectedService.value.path
    );
    
    serviceExists.value = !!existing;
    existingServiceId.value = existing?.SERVICE_ID || null;
  } catch (err) {
    console.error('Error checking service existence:', err);
  }
};

// Check which parameters already exist
const checkExistingParameters = async (reqParams: any[], respParams: any[]) => {
  if (!existingServiceId.value) return;
  
  try {
    const result = await client.graphql({ query: queries.listServiceParams });
    const existingParams = result.data.listSERVICE_PARAMS.items.filter(
      (p: any) => p.SERVICE_ID === existingServiceId.value
    );
    
    // Mark existing request parameters and disable/uncheck them
    reqParams.forEach(param => {
      const exists = existingParams.some((ep: any) => ep.PARAM_NAME === param.name);
      param.exists = exists;
      if (exists) {
        param.import = false;
      }
    });
    
    // Mark existing response parameters and disable/uncheck them
    respParams.forEach(param => {
      const exists = existingParams.some((ep: any) => ep.PARAM_NAME === param.name);
      param.exists = exists;
      if (exists) {
        param.import = false;
      }
    });
  } catch (err) {
    console.error('Error checking existing parameters:', err);
  }
};

// Add custom parameter
const addCustomParam = (type: 'request' | 'response') => {
  const newParam = {
    name: '',
    type: 'string',
    required: false,
    description: '',
    location: type === 'request' ? 'custom' : 'response',
    exists: false,
    custom: true,
    import: false
  };
  
  if (type === 'request') {
    requestParams.value.unshift(newParam);
    applyFilters();
  } else {
    responseParams.value.unshift(newParam);
  }
};

// Remove custom parameter
const removeCustomParam = (index: number, type: 'request' | 'response') => {
  if (type === 'request') {
    requestParams.value.splice(index, 1);
    applyFilters();
  } else {
    responseParams.value.splice(index, 1);
  }
};

// Insert new service
const insertService = async () => {
  saving.value = true;
  
  try {
    const serviceUri = selectedService.value.path;
    let serviceId = existingServiceId.value;
    
    // Check if service exists
    if (!serviceExists.value) {
      const serviceInput = {
        SERVICE_PROVIDER_ID: 1,
        URI: serviceUri,
        CREATED_BY_USER_ID: 1,
        CREATED_DATE: new Date().toISOString().split('T')[0]
      };
      
      const serviceResult = await client.graphql({
        query: mutations.createService,
        variables: { input: serviceInput }
      });
      
      serviceId = serviceResult.data.createSERVICE.SERVICE_ID;
    }
    
    // Get existing parameters for this service
    const existingParamsResult = await client.graphql({ query: queries.listServiceParams });
    const existingParams = existingParamsResult.data.listSERVICE_PARAMS.items.filter(
      (p: any) => p.SERVICE_ID === serviceId
    );
    
    // Insert only checked parameters that don't exist
    const paramsToInsert = requestParams.value.filter(param => 
      param.import && 
      param.name && 
      !existingParams.some((ep: any) => ep.PARAM_NAME === param.name)
    );
    
    if (paramsToInsert.length > 0) {
      showProgressModal.value = true;
      
      const paramInputs = paramsToInsert.map(param => ({
        SERVICE_ID: serviceId,
        PARAM_NAME: param.name,
        CREATED_BY_USER_ID: 1,
        CREATED_DATE: new Date().toISOString().split('T')[0]
      }));
      
      await createServiceParamBatch(paramInputs);
    }
    
    showProgressModal.value = false;
    showSuccessModal.value = true;
  } catch (err: any) {
    errorMessage.value = err.message || 'Failed to insert service';
    showErrorModal.value = true;
    showProgressModal.value = false;
  } finally {
    saving.value = false;
  }
};

// Update existing service parameters
const updateService = async () => {
  saving.value = true;
  
  try {
    const paramsToInsert = requestParams.value.filter(param => param.import && param.name && !param.exists);
    
    if (paramsToInsert.length > 0) {
      showProgressModal.value = true;
      
      const paramInputs = paramsToInsert.map(param => ({
        SERVICE_ID: existingServiceId.value,
        PARAM_NAME: param.name,
        CREATED_BY_USER_ID: 1,
        CREATED_DATE: new Date().toISOString().split('T')[0]
      }));
      
      await createServiceParamBatch(paramInputs);
    }
    
    showProgressModal.value = false;
    showSuccessModal.value = true;
  } catch (err: any) {
    errorMessage.value = err.message || 'Failed to update service';
    showErrorModal.value = true;
    showProgressModal.value = false;
  } finally {
    saving.value = false;
  }
};

const toggleSelectAll = () => {
  const newValue = !allSelected.value;
  requestParams.value.forEach(param => {
    param.import = newValue;
  });
};

const applyFilters = () => {
  let filtered = requestParams.value.filter(param => {
    return (!filters.value.name || param.name.toLowerCase().includes(filters.value.name.toLowerCase())) &&
           (!filters.value.type || param.type.toLowerCase().includes(filters.value.type.toLowerCase())) &&
           (!filters.value.description || param.description.toLowerCase().includes(filters.value.description.toLowerCase()));
  });
  
  if (sortField.value) {
    filtered.sort((a, b) => {
      const aVal = String(a[sortField.value] || '').toLowerCase();
      const bVal = String(b[sortField.value] || '').toLowerCase();
      const comparison = aVal.localeCompare(bVal);
      return sortDirection.value === 'asc' ? comparison : -comparison;
    });
  }
  
  filteredParams.value = filtered;
};

const clearFilters = () => {
  filters.value = { name: '', type: '', description: '' };
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

const closeSuccessModal = () => {
  showSuccessModal.value = false;
  resetForm();
};

// Reset form
const resetForm = () => {
  selectedFile.value = null;
  parsedServices.value = [];
  selectedService.value = null;
  requestParams.value = [];
  responseParams.value = [];
  serviceExists.value = false;
  existingServiceId.value = null;
  error.value = '';
  sortField.value = '';
  sortDirection.value = 'asc';
  filters.value = { name: '', type: '', description: '' };
  filteredParams.value = [];
};
</script>

<style scoped>
.service-import {
  width: 75vw;
  height: 90vh;
  margin: 0 auto;
  padding: 20px;
  overflow: auto;
}

.upload-section {
  margin-bottom: 20px;
  padding: 20px;
  border: 2px dashed #ccc;
  border-radius: 5px;
}

.upload-section input[type="file"] {
  margin-right: 10px;
}

.upload-section button {
  padding: 8px 16px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.upload-section button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.error {
  background-color: #f8d7da;
  color: #721c24;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.service-selection {
  margin-bottom: 20px;
}

.service-selection select {
  width: 100%;
  padding: 8px;
  font-size: 14px;
}

.service-details {
  background-color: #f9f9f9;
  padding: 20px;
  border-radius: 5px;
}

.parameters-section {
  margin-bottom: 30px;
}

.params-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 10px;
  table-layout: fixed;
}

.params-table {
  position: sticky;
  top: 0;
  z-index: 10;
}

.params-table th {
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

.params-table th:nth-child(1) { width: 60px; }
.params-table th:nth-child(2) { width: 30%; }
.params-table th:nth-child(3) { width: 15%; }
.params-table th:nth-child(4) { width: 45%; }
.params-table th:nth-child(5) { width: 10%; }

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

.params-table th,
.params-table td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

.w-12 { width: 3rem; }
.w-16 { width: 4rem; }
.w-20 { width: 5rem; }
.w-24 { width: 6rem; }
.w-32 { width: 8rem; }
.w-48 { width: 12rem; }
.w-72 { width: 18rem; }
.w-18 { width: 4.5rem; }
.w-8 { width: 2rem; }
.w-desc { width: 15rem; }
.text-xs { font-size: 0.75rem; }
.w-full { width: 100%; }
.text-center { text-align: center; }
.h-4 { height: 1rem; }
.text-red-600 { color: #dc2626; }
.hover\:text-red-800:hover { color: #991b1b; }

.params-table th {
  background-color: #f2f2f2;
}

.params-table tr.existing {
  background-color: #e9ecef;
}

.params-table input.disabled {
  background-color: #e9ecef;
  color: #6c757d;
}

.params-table input[type="checkbox"]:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}



.action-buttons {
  margin-top: 20px;
  text-align: center;
}

.insert-btn,
.update-btn {
  padding: 10px 20px;
  font-size: 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.insert-btn {
  background-color: #007bff;
  color: white;
}

.update-btn {
  background-color: #ffc107;
  color: black;
}

.insert-btn:disabled,
.update-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
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