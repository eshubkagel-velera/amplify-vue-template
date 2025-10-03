<template>
  <div class="service-import">
    <div class="header-row">
      <h2>Import Services from OpenAPI</h2>
    </div>
    
    <!-- Format Selection -->
    <div class="format-section">
      <label for="formatType">Import Format:</label>
      <select id="formatType" v-model="selectedFormat" @change="onFormatChange">
        <option value="openapi">OpenAPI</option>
        <option value="json">JSON</option>
      </select>
    </div>

    <!-- OpenAPI File Upload Section -->
    <div v-if="selectedFormat === 'openapi'" class="upload-section">
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

    <!-- JSON Import Section -->
    <div v-if="selectedFormat === 'json'" class="json-section">
      <div class="json-input-section">
        <label>JSON Input: <a href="#" @click.prevent="showQueryModal = true" class="help-link">Need help generating JSON?</a></label>
        <div class="json-controls">
          <input 
            type="file" 
            @change="handleJsonFileUpload" 
            accept=".json"
            ref="jsonFileInput"
          />
          <button v-if="selectedJsonFile" @click="clearJsonFile" class="clear-btn">Clear File</button>
        </div>
        <div class="json-input-container">
          <div class="json-sample">
            <strong>Expected Format:</strong>
            <pre>{
  "path": "/api/endpoint",
  "method": "POST",
  "parameters": [
    {
      "name": "$.param1",
      "type": "string"
    },
    {
      "name": "$.param2", 
      "type": "number"
    }
  ]
}</pre>
          </div>
          <textarea 
            v-model="jsonText" 
            placeholder="Paste JSON here or select a file above"
            rows="10"
            class="json-textarea"
          ></textarea>
        </div>
        <button @click="parseJsonData" :disabled="(!jsonText && !selectedJsonFile) || loading">
          {{ loading ? 'Parsing...' : 'Parse JSON Data' }}
        </button>
      </div>
    </div>

    <!-- Error Display -->
    <div v-if="error" class="error">
      {{ error }}
    </div>

    <!-- Service Provider Selection -->
    <div v-if="parsedServices.length > 0" class="service-provider-section">
      <h3>Service Provider:</h3>
      <div class="provider-input-group">
        <select v-model="selectedServiceProvider" @change="onServiceProviderChange" class="provider-select">
          <option value="">-- Select Service Provider --</option>
          <option v-for="provider in serviceProviders" :key="provider.SERVICE_PROVIDER_ID" :value="provider.SERVICE_PROVIDER_ID">
            {{ provider.SERVICE_PROVIDER_NAME }}
          </option>
          <option value="new">+ Add New Provider</option>
        </select>
        <input 
          v-if="selectedServiceProvider === 'new'" 
          v-model="newServiceProviderName" 
          placeholder="Enter new provider name"
          class="new-provider-input"
        />
      </div>
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
      <!-- Action Buttons and Target Parameters Row -->
      <div v-if="selectedService" class="buttons-params-row">
        <!-- Action Buttons -->
        <div class="action-buttons">
          <button 
            v-if="!serviceExists" 
            @click="insertService" 
            :disabled="saving || !selectedServiceProvider || (selectedServiceProvider === 'new' && !newServiceProviderName.trim()) || readonly"
            class="btn-success"
          >
            {{ readonly ? 'View Only Mode' : (saving ? 'Inserting...' : 'Insert Service') }}
          </button>
          <button 
            v-if="serviceExists" 
            @click="updateService" 
            :disabled="saving || readonly"
            class="btn-primary"
          >
            {{ readonly ? 'View Only Mode' : (saving ? 'Updating...' : 'Update Parameters') }}
          </button>
          <button @click="addCustomParam('request')" :disabled="readonly" class="btn-success">
            {{ readonly ? 'View Only Mode' : 'Add Custom Parameter' }}
          </button>
        </div>

        <!-- Target Parameters Available -->
        <div class="target-params-info">
          <h3>Request Parameters Available: {{ filteredParams.length }}</h3>
        </div>
      </div>
      
      <h3>Service: {{ selectedService.method.toUpperCase() }} {{ selectedService.path }}</h3>
      
      <!-- Request Parameters Table -->
      <div class="parameters-section">
        <h4>Request Parameters</h4>
        <div class="table-container">
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
              <td>
                <input v-if="param.custom && !param.exists" v-model="param.name" class="full-width-input">
                <span v-else class="read-only-text">{{ param.name }}</span>
              </td>
              <td>
                <select v-if="param.custom && !param.exists" v-model="param.type" class="full-width-input">
                  <option value="string">string</option>
                  <option value="number">number</option>
                  <option value="integer">integer</option>
                  <option value="boolean">boolean</option>
                  <option value="array">array</option>
                  <option value="object">object</option>
                  <option value="file">file</option>
                </select>
                <span v-else class="read-only-text">{{ param.type }}</span>
              </td>

              <td>
                <textarea v-if="param.custom && !param.exists" v-model="param.description" class="full-width-textarea" rows="2"></textarea>
                <span v-else class="read-only-text">{{ param.description }}</span>
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
    
    <!-- Query Help Modal -->
    <div v-if="showQueryModal" class="modal-overlay">
      <div class="modal-content query-modal">
        <h3>Generate Database Query</h3>
        <p>Use this query to extract service parameters from your database:</p>
        
        <div class="query-inputs">
          <div class="input-group">
            <label>Service ID:</label>
            <input v-model="queryServiceId" type="number" placeholder="e.g. 57" @input="generateQuery" :disabled="queryUri.trim() !== ''" />
          </div>
          <div class="input-group">
            <label>OR URI (partial match):</label>
            <input v-model="queryUri" type="text" placeholder="e.g. FIMember-Card" @input="generateQuery" :disabled="queryServiceId !== '' && queryServiceId != null" />
          </div>
        </div>
        
        <div class="query-output">
          <label>Generated Query:</label>
          <textarea v-model="generatedQuery" readonly rows="15" class="query-textarea"></textarea>
          <button @click="copyQuery" class="copy-btn">Copy Query</button>
        </div>
        
        <div class="form-actions">
          <button @click="showQueryModal = false" class="btn-primary">Close</button>
        </div>
      </div>
    </div>
    
    <!-- Error Modal -->
    <div v-if="showErrorModal" class="modal-overlay">
      <div class="modal-content">
        <h3>Error</h3>
        <div v-if="errorMessage.includes('JSON Format Validation Failed')">
          <p style="white-space: pre-line; margin-bottom: 15px;">{{ errorMessage.split('Expected Format:')[0] }}</p>
          <div class="json-sample">
            <strong>Expected Format:</strong>
            <pre>{
  "path": "/api/endpoint",
  "method": "POST",
  "parameters": [
    {
      "name": "$.param1",
      "type": "string"
    },
    {
      "name": "$.param2", 
      "type": "number"
    }
  ]
}</pre>
          </div>
        </div>
        <p v-else>{{ errorMessage }}</p>
        <div class="form-actions">
          <button @click="clearError" class="btn-primary">OK</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Buffer } from 'buffer';
import SwaggerParser from '@apidevtools/swagger-parser';
import { callExternalApi } from '../client.js';
import { useErrorHandler } from '../composables/useErrorHandler';
import type { Service, ServiceParam, ServiceProvider } from '../types';

// Make Buffer available globally for SwaggerParser
if (typeof window !== 'undefined') {
  (window as any).Buffer = Buffer;
}
// Removed query imports - using string names instead

// Load service providers on component mount
const loadServiceProviders = async () => {
  try {
    const result = await callExternalApi(window.currentEnvironment, 'listSERVICE_PROVIDERS');
    serviceProviders.value = result.data.listSERVICE_PROVIDERS.items;
  } catch (err) {
    console.error('Error loading service providers:', err);
  }
};

// Create new service provider if needed
const createServiceProviderIfNeeded = async () => {
  if (!newServiceProviderName.value.trim()) return null;
  
  // Check if provider already exists
  const existing = serviceProviders.value.find(sp => 
    sp.SERVICE_PROVIDER_NAME.toLowerCase() === newServiceProviderName.value.toLowerCase()
  );
  
  if (existing) {
    return existing.SERVICE_PROVIDER_ID;
  }
  
  // Create new provider
  try {
    const providerInput = {
      SERVICE_PROVIDER_NAME: newServiceProviderName.value.trim(),
      CREATED_BY_USER_ID: userProfileId.value || 1,
      CREATED_DATE: new Date().toISOString().split('T')[0]
    };
    
    const result = await callExternalApi(window.currentEnvironment, createServiceProvider, { input: providerInput });
    
    const newProvider = result.data.createSERVICE_PROVIDER;
    serviceProviders.value.push(newProvider);
    return newProvider.SERVICE_PROVIDER_ID;
  } catch (err) {
    console.error('Error creating service provider:', err);
    throw err;
  }
};

// Handle service provider selection
const onServiceProviderChange = async (event: Event) => {
  const target = event.target as HTMLSelectElement;
  const value = target.value;
  
  if (value === 'new') {
    selectedServiceProvider.value = 'new';
    newServiceProviderName.value = '';
  } else {
    selectedServiceProvider.value = value;
    newServiceProviderName.value = '';
  }
  
  // Recheck service existence when provider changes
  if (selectedService.value && selectedServiceProvider.value) {
    await checkServiceExists();
    // Recheck existing parameters
    await checkExistingParameters(requestParams.value, responseParams.value);
    applyFilters();
  }
};

import { createServiceBatch, createServiceParamBatch } from '../graphql.ts';
import { createService, createServiceParam, createServiceProvider } from '../graphql/mutations.js';
import { fetchUserAttributes } from 'aws-amplify/auth';




// Initialize component
loadServiceProviders();

// Props
const props = defineProps({
  readonly: {
    type: Boolean,
    default: false
  }
});

// Reactive data
const selectedFile = ref<File | null>(null);
const readonly = computed(() => props.readonly);
const jsonFileInput = ref<HTMLInputElement | null>(null);
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
const { error: errorMessage, showErrorModal, handleError, clearError } = useErrorHandler();
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
const selectedFormat = ref('openapi');
const jsonText = ref('');
const selectedJsonFile = ref(null);
const showQueryModal = ref(false);
const queryServiceId = ref('');
const queryUri = ref('');
const generatedQuery = ref('');
const isResizing = ref(false);
const resizeData = ref({ field: '', startX: 0, startWidth: 0 });
const serviceProviders = ref<ServiceProvider[]>([]);
const selectedServiceProvider = ref('');
const newServiceProviderName = ref('');
const userProfileId = ref(null);

// Load user profile
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

// Initialize user profile
loadUserProfile();

// File handling
const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    selectedFile.value = target.files[0];
    error.value = '';
  }
};

const handleJsonFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    selectedJsonFile.value = target.files[0];
    try {
      const fileContent = await target.files[0].text();
      jsonText.value = fileContent;
      error.value = '';
    } catch (err) {
      error.value = 'Failed to read file content';
      jsonText.value = '';
    }
  }
};

const clearJsonFile = () => {
  selectedJsonFile.value = null;
  if (jsonFileInput.value) {
    jsonFileInput.value.value = '';
  }
};

const onFormatChange = () => {
  // Clear previous data when format changes
  selectedFile.value = null;
  selectedJsonFile.value = null;
  jsonText.value = '';
  parsedServices.value = [];
  selectedService.value = null;
  requestParams.value = [];
  responseParams.value = [];
  filteredParams.value = [];
  error.value = '';
};

const generateQuery = () => {
  let whereClause = '';
  if (queryServiceId.value.trim()) {
    whereClause = `WHERE s.SERVICE_ID = ${queryServiceId.value.trim()}`;
  } else if (queryUri.value.trim()) {
    whereClause = `WHERE s.URI LIKE '%${queryUri.value.trim()}%'`;
  } else {
    whereClause = 'WHERE s.SERVICE_ID = YOUR_SERVICE_ID';
  }
  
  generatedQuery.value = `SELECT
  JSON_OBJECT(
    'SERVICE_ID', s.SERVICE_ID,
    'path', s.URI,
    'method', 'POST',
    'parameters', (
      SELECT JSON_ARRAYAGG(
        JSON_OBJECT(
          'name', PARAM_NAME,
          'type', 'string'
        )
      )
      FROM SERVICE_PARAM sp
      WHERE sp.SERVICE_ID = s.SERVICE_ID
    )
  ) as json_result
FROM SERVICE s
${whereClause};`;
};

const copyQuery = () => {
  navigator.clipboard.writeText(generatedQuery.value);
};



// Parse JSON data
const parseJsonData = async () => {
  loading.value = true;
  error.value = '';
  
  try {
    let jsonData;
    
    if (selectedJsonFile.value) {
      const fileContent = await selectedJsonFile.value.text();
      jsonData = JSON.parse(fileContent);
    } else if (jsonText.value.trim()) {
      jsonData = JSON.parse(jsonText.value);
    } else {
      throw new Error('No JSON data provided');
    }
    
    // Validate JSON structure
    const validationErrors = [];
    
    if (!jsonData.path || typeof jsonData.path !== 'string') {
      validationErrors.push('Missing or invalid "path" field (must be a string)');
    }
    
    if (!jsonData.parameters) {
      validationErrors.push('Missing "parameters" field');
    } else if (!Array.isArray(jsonData.parameters)) {
      validationErrors.push('"parameters" must be an array');
    } else {
      jsonData.parameters.forEach((param, index) => {
        if (!param.name || typeof param.name !== 'string') {
          validationErrors.push(`Parameter ${index + 1}: missing or invalid "name" field`);
        }
        if (!param.type || typeof param.type !== 'string') {
          validationErrors.push(`Parameter ${index + 1}: missing or invalid "type" field`);
        }
      });
    }
    
    if (validationErrors.length > 0) {
      errorMessage.value = 'JSON Format Validation Failed:\n\n' + validationErrors.join('\n');
      showErrorModal.value = true;
      return;
    }
    
    // Convert JSON to service format
    const service = {
      path: jsonData.path,
      method: jsonData.method || 'POST',
      operationId: `${jsonData.method || 'post'}_${jsonData.path.replace(/[^a-zA-Z0-9]/g, '_')}`,
      summary: `${jsonData.method || 'GET'} ${jsonData.path}`,
      description: '',
      parameters: [],
      requestBody: null,
      responses: {}
    };
    
    parsedServices.value = [service];
    
    // Auto-select the service
    selectedService.value = service;
    await onServiceSelect();
    
  } catch (err: any) {
    error.value = `Failed to parse JSON: ${err.message}`;
  } finally {
    loading.value = false;
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
  // Clear tables first
  requestParams.value = [];
  responseParams.value = [];
  filteredParams.value = [];
  
  if (!selectedService.value) return;
  
  // Extract request parameters
  const reqParams = extractRequestParameters(selectedService.value);
  const respParams = extractResponseParameters(selectedService.value);
  
  // Check if service exists (only if service provider is selected)
  if (selectedServiceProvider.value) {
    await checkServiceExists();
    // Always check which parameters already exist for this service
    await checkExistingParameters(reqParams, respParams);
  }
  
  requestParams.value = reqParams;
  responseParams.value = respParams;
  
  // Initialize filteredParams with all request parameters
  filteredParams.value = [...reqParams];
  applyFilters();
};

// Initialize query with default
generateQuery();

// Extract request parameters from OpenAPI spec or JSON format
const extractRequestParameters = (service: any) => {
  const params: any[] = [];
  
  // Handle JSON format (from SQL export)
  if (selectedFormat.value === 'json') {
    let jsonData;
    
    if (selectedJsonFile.value || jsonText.value) {
      try {
        if (selectedJsonFile.value) {
          // File content was already parsed in parseJsonData
          const fileContent = jsonText.value || '{}';
          jsonData = JSON.parse(fileContent);
        } else {
          jsonData = JSON.parse(jsonText.value);
        }
        
        if (jsonData.parameters && Array.isArray(jsonData.parameters)) {
          jsonData.parameters.forEach((param: any) => {
            params.push({
              name: param.name,
              type: param.type || 'string',
              required: false,
              description: param.description || '',
              location: 'json',
              exists: false,
              custom: true,
              import: true
            });
          });
        }
      } catch (err) {
        console.error('Error parsing JSON parameters:', err);
      }
    }
    
    return params;
  }
  
  // Handle OpenAPI format
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

  
  if (!schema) {
    console.log('No schema provided');
    return;
  }
  

  
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
    // Get service provider ID
    let serviceProviderId;
    if (selectedServiceProvider.value === 'new') {
      // For new providers, we know it doesn't exist yet
      serviceExists.value = false;
      existingServiceId.value = null;
      return;
    } else {
      serviceProviderId = parseInt(selectedServiceProvider.value);
    }
    
    const result = await callExternalApi(window.currentEnvironment, 'listSERVICES');
    const services = result.data.listSERVICES.items;
    
    const existing = services.find((s: any) => 
      s.URI === selectedService.value.path && s.SERVICE_PROVIDER_ID === serviceProviderId
    );
    
    serviceExists.value = !!existing;
    existingServiceId.value = existing?.SERVICE_ID || null;
  } catch (err) {
    console.error('Error checking service existence:', err);
  }
};

// Check which parameters already exist for specific service
const checkExistingParameters = async (reqParams: any[], respParams: any[]) => {
  if (!existingServiceId.value) return;
  
  try {
    const result = await callExternalApi(window.currentEnvironment, 'listSERVICE_PARAMS', {
      filter: { SERVICE_ID: { eq: existingServiceId.value } }
    });
    const allExistingParams = result.data.listSERVICE_PARAMS.items;
    
    // Mark existing request parameters and disable/uncheck them
    reqParams.forEach(param => {
      const exists = allExistingParams.some((ep: any) => ep.PARAM_NAME === param.name);
      param.exists = exists;
      if (exists) {
        param.import = false;
      }
    });
    
    // Mark existing response parameters and disable/uncheck them
    respParams.forEach(param => {
      const exists = allExistingParams.some((ep: any) => ep.PARAM_NAME === param.name);
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
  if (props.readonly) return;
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
  if (props.readonly) return;
  saving.value = true;
  
  try {
    const serviceUri = selectedService.value.path;
    let serviceId = existingServiceId.value;
    
    // Get or create service provider ID
    let serviceProviderId;
    if (selectedServiceProvider.value === 'new') {
      serviceProviderId = await createServiceProviderIfNeeded();
      if (!serviceProviderId) {
        throw new Error('Failed to create service provider');
      }
    } else {
      serviceProviderId = parseInt(selectedServiceProvider.value);
    }
    
    // Check if service exists
    if (!serviceExists.value) {
      const serviceInput = {
        SERVICE_PROVIDER_ID: serviceProviderId,
        URI: serviceUri,
        REQUEST_TYPE: selectedService.value.method.toUpperCase(),
        CREATED_BY_USER_ID: userProfileId.value || 1,
        CREATED_DATE: new Date().toISOString().split('T')[0]
      };
      
      const serviceResult = await callExternalApi(window.currentEnvironment, createService, { input: serviceInput });
      
      serviceId = serviceResult.data.createSERVICE.SERVICE_ID;
      
      // Handle placeholder ID
      if (serviceId === -1) {
        const findResult = await callExternalApi(window.currentEnvironment, 'listSERVICES');
        const realService = findResult.data.listSERVICES.items
          .filter(s => s.SERVICE_PROVIDER_ID === serviceProviderId && s.URI === serviceUri)
          .sort((a, b) => b.SERVICE_ID - a.SERVICE_ID)[0];
        if (realService) {
          serviceId = realService.SERVICE_ID;
        }
      }
    }
    
    // Get fresh existing parameters for this service only
    const result = await callExternalApi(window.currentEnvironment, 'listSERVICE_PARAMS', {
      filter: { SERVICE_ID: { eq: serviceId } }
    });
    const existingParams = result.data.listSERVICE_PARAMS.items;
    
    // Update requestParams to mark existing ones for THIS service only
    requestParams.value.forEach(param => {
      const exists = existingParams.some((ep: any) => ep.PARAM_NAME === param.name);
      if (exists) {
        param.exists = true;
        param.import = false;
      }
    });
    
    // Insert only checked parameters that don't exist
    const paramsToInsert = requestParams.value.filter(param => 
      param.import && 
      param.name.trim() && 
      !param.exists
    );
    
    if (paramsToInsert.length > 0) {
      showProgressModal.value = true;
      totalInserts.value = paramsToInsert.length;
      currentInsert.value = 0;
      
      const paramInputs = paramsToInsert.map(param => ({
        SERVICE_ID: serviceId,
        PARAM_NAME: param.name,
        CREATED_BY_USER_ID: userProfileId.value || 1,
        CREATED_DATE: new Date().toISOString().split('T')[0]
      }));
      
      for (const paramInput of paramInputs) {
        try {
          await callExternalApi(window.currentEnvironment, createServiceParam, { input: paramInput });
          currentInsert.value++;
        } catch (err) {
          console.error('Failed to create parameter:', paramInput.PARAM_NAME, err);
          if (err.errors) {
            err.errors.forEach(error => console.error('GraphQL Error:', error.message));
          }
        }
      }
    }
    
    showProgressModal.value = false;
    
    // Refresh the service selection to show newly inserted parameters
    if (currentInsert.value > 0) {
      await onServiceSelect();
    }
    
    showSuccessModal.value = true;
  } catch (err: any) {
    handleError(err, 'inserting service');
    showProgressModal.value = false;
  } finally {
    saving.value = false;
  }
};

// Update existing service parameters
const updateService = async () => {
  if (props.readonly) return;
  saving.value = true;
  
  try {
    // Get fresh existing parameters for this service only
    const result = await callExternalApi(window.currentEnvironment, 'listSERVICE_PARAMS', {
      filter: { SERVICE_ID: { eq: existingServiceId.value } }
    });
    const existingParams = result.data.listSERVICE_PARAMS.items;
    
    // Update requestParams to mark existing ones for THIS service only
    requestParams.value.forEach(param => {
      const exists = existingParams.some((ep: any) => ep.PARAM_NAME === param.name);
      if (exists) {
        param.exists = true;
        param.import = false;
      }
    });
    
    const paramsToInsert = requestParams.value.filter(param => 
      param.import && 
      param.name.trim() && 
      !param.exists
    );
    
    if (paramsToInsert.length > 0) {
      showProgressModal.value = true;
      totalInserts.value = paramsToInsert.length;
      currentInsert.value = 0;
      
      const paramInputs = paramsToInsert.map(param => ({
        SERVICE_ID: existingServiceId.value,
        PARAM_NAME: param.name,
        CREATED_BY_USER_ID: userProfileId.value || 1,
        CREATED_DATE: new Date().toISOString().split('T')[0]
      }));
      
      for (const paramInput of paramInputs) {
        try {
          await callExternalApi(window.currentEnvironment, createServiceParam, { input: paramInput });
          currentInsert.value++;
        } catch (err) {
          console.error('Failed to create parameter:', paramInput.PARAM_NAME, err);
          if (err.errors) {
            err.errors.forEach(error => console.error('GraphQL Error:', error.message));
          }
        }
      }
    }
    
    showProgressModal.value = false;
    
    // Refresh the service selection to show newly inserted parameters
    if (currentInsert.value > 0) {
      await onServiceSelect();
    }
    
    showSuccessModal.value = true;
  } catch (err: any) {
    handleError(err, 'updating service');
    showProgressModal.value = false;
  } finally {
    saving.value = false;
  }
};

const toggleSelectAll = () => {
  const newValue = !allSelected.value;
  requestParams.value.forEach(param => {
    if (!param.exists) {
      param.import = newValue;
    }
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

// Reset form
const resetForm = () => {
  // Clear tables immediately
  requestParams.value = [];
  responseParams.value = [];
  filteredParams.value = [];
  
  selectedFile.value = null;
  parsedServices.value = [];
  selectedService.value = null;
  serviceExists.value = false;
  existingServiceId.value = null;
  error.value = '';
  sortField.value = '';
  sortDirection.value = 'asc';
  filters.value = { name: '', type: '', description: '' };
  selectedServiceProvider.value = '';
  newServiceProviderName.value = '';
};
</script>

<style scoped>
.service-import {
  width: 75vw;
  height: 90vh;
  margin: 0 auto;
  padding: 20px;
  overflow: auto;
  background-color: var(--bg-color);
  color: var(--text-color);
}

.upload-section {
  margin-bottom: 20px;
  padding: 20px;
  border: 2px dashed var(--border-color);
  border-radius: 5px;
  background-color: var(--bg-color);
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

.service-provider-section {
  margin-bottom: 20px;
  padding: 15px;
  background-color: var(--bg-color);
  border: 1px solid var(--border-color);
  border-radius: 5px;
}

.provider-input-group {
  display: flex;
  gap: 10px;
  align-items: center;
}

.provider-select {
  flex: 1;
  padding: 8px;
  font-size: 14px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background-color: var(--input-bg);
  color: var(--text-color);
}

.new-provider-input {
  flex: 1;
  padding: 8px;
  font-size: 14px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background-color: var(--input-bg);
  color: var(--text-color);
}

.service-selection {
  margin-bottom: 20px;
}

.service-selection select {
  width: 100%;
  padding: 8px;
  font-size: 14px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background-color: var(--input-bg);
  color: var(--text-color);
}

.service-details {
  background-color: var(--bg-color);
  border: 1px solid var(--border-color);
  padding: 20px;
  border-radius: 5px;
}

.parameters-section {
  margin-bottom: 30px;
}

.table-container {
  max-height: 600px;
  overflow: auto;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background-color: var(--bg-color);
}

.params-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
  table-layout: fixed;
}

.params-table th {
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

.buttons-params-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 20px;
}

.target-params-info {
  width: fit-content;
}

.action-buttons button {
  margin-right: 10px;
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

.full-width-input {
  width: 100%;
  padding: 4px;
  border: 1px solid var(--border-color);
  border-radius: 3px;
  box-sizing: border-box;
  background-color: var(--input-bg);
  color: var(--text-color);
}

.full-width-textarea {
  width: 100%;
  padding: 4px;
  border: 1px solid var(--border-color);
  border-radius: 3px;
  box-sizing: border-box;
  resize: vertical;
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
  background-color: var(--table-filter-bg);
}

.sort-indicator {
  margin-left: 5px;
  font-weight: bold;
}

.filter-input {
  width: 100%;
  padding: 4px;
  font-size: 12px;
  border: 1px solid var(--border-color);
  border-radius: 3px;
  background-color: var(--input-bg);
  color: var(--text-color);
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
  border: 1px solid var(--border-color);
  padding: 8px;
  text-align: left;
  background-color: var(--bg-color);
  color: var(--text-color);
}



.params-table th {
  background-color: var(--table-header-bg);
}

.params-table tr.existing {
  background-color: var(--table-filter-bg);
}

.params-table input.disabled {
  background-color: var(--table-filter-bg);
  color: var(--text-color);
  opacity: 0.6;
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

.format-section {
  margin-bottom: 20px;
  padding: 15px;
  background-color: var(--bg-color);
  border: 1px solid var(--border-color);
  border-radius: 5px;
}

.format-section label {
  display: inline-block;
  margin-right: 10px;
  font-weight: bold;
}

.format-section select {
  padding: 5px;
  min-width: 150px;
}

.json-section {
  margin-bottom: 20px;
  padding: 20px;
  border: 2px dashed #28a745;
  border-radius: 5px;
  background-color: var(--bg-color);
}

.json-input-section label {
  display: block;
  margin-bottom: 10px;
  font-weight: bold;
}

.json-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.clear-btn {
  padding: 5px 10px;
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-size: 12px;
}

.clear-btn:hover {
  background-color: #c82333;
}

.json-textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
  margin-bottom: 10px;
  resize: vertical;
  background-color: var(--input-bg);
  color: var(--text-color);
}

.json-textarea:disabled {
  background-color: var(--table-filter-bg);
  color: var(--text-color);
  opacity: 0.6;
}

.json-section button {
  padding: 8px 16px;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.json-section button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.json-input-container {
  display: flex;
  gap: 15px;
}

.json-textarea {
  flex: 1;
}

.json-sample {
  flex: 0 0 300px;
  background-color: var(--input-bg);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 10px;
}

.json-sample strong {
  display: block;
  margin-bottom: 8px;
  color: #495057;
}

.json-sample pre {
  margin: 0;
  font-size: 11px;
  color: #6c757d;
  white-space: pre-wrap;
  line-height: 1.3;
}

.help-link {
  color: #007bff;
  text-decoration: none;
  font-size: 12px;
  margin-left: 10px;
}

.help-link:hover {
  text-decoration: underline;
}

.query-modal {
  min-width: 600px;
  max-width: 800px;
}

.query-inputs {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.input-group {
  flex: 1;
}

.input-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.input-group input {
  width: 100%;
  padding: 8px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background-color: var(--input-bg);
  color: var(--text-color);
}

.query-output {
  margin-bottom: 20px;
}

.query-output label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.query-textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
  background-color: var(--input-bg);
  color: var(--text-color);
  resize: vertical;
}

.copy-btn {
  margin-top: 10px;
  padding: 8px 16px;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.copy-btn:hover {
  background-color: #218838;
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
