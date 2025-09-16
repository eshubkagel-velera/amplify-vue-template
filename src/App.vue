<template>
  <div id="app">
    <AuthWrapper>
      <header>
        <h1>GraphQL API Manager</h1>
      <nav>
        <select v-model="currentView" @change="changeView" :disabled="showMappingManager || showRedirectUrlManager || showStepServicesManager || showServiceParamsManager || showServiceStepMappingManager">
          <option v-for="entity in sortedEntities" :key="entity.name" :value="entity.name">
            {{ entity.name }}
          </option>
          <option value="import">Import Services</option>
        </select>
        <button v-if="showMappingManager" @click="closeMappingManager" class="btn-primary" style="margin-left: 10px;">
          Back to {{ currentView }}
        </button>
        <button v-if="showRedirectUrlManager" @click="closeRedirectUrlManager" class="btn-primary" style="margin-left: 10px;">
          Back to ORIGIN_PRODUCT
        </button>
        <button v-if="showStepServicesManager" @click="closeStepServicesManager" class="btn-primary" style="margin-left: 10px;">
          Back to STEP_TYPE
        </button>
        <button v-if="showServiceParamsManager" @click="closeServiceParamsManager" class="btn-primary" style="margin-left: 10px;">
          Back to SERVICE
        </button>
        <button v-if="showServiceStepMappingManager" @click="closeServiceStepMappingManager" class="btn-primary" style="margin-left: 10px;">
          Back to SERVICE
        </button>
      </nav>
    </header>
    
    <main>
      <MappingManagerStandalone v-if="showMappingManager" :productId="selectedProductId" :readonly="isReadonly" />
      <RedirectUrlStandalone v-else-if="showRedirectUrlManager" :productId="selectedProductId" :readonly="isReadonly" />
      <StepServiceMappingStandalone v-else-if="showStepServicesManager" :stepTypeId="selectedStepTypeId" :readonly="isReadonly" />
      <ServiceParamsStandalone v-else-if="showServiceParamsManager" :serviceId="selectedServiceId" :readonly="isReadonly" />
      <ServiceStepMappingStandalone v-else-if="showServiceStepMappingManager" :serviceId="selectedServiceId" :readonly="isReadonly" />
      <RedirectUrlStandalone v-else-if="currentView === 'REDIRECT_URL'" :readonly="isReadonly" />
      <MappingManagerStandalone v-else-if="currentView === 'SERVICE_PARAM_MAPPING'" :readonly="isReadonly" />
      <ServiceImport v-else-if="currentView === 'import'" :readonly="isReadonly" />
      <EntityManager
        v-else-if="currentView && currentEntityConfig && currentView !== 'REDIRECT_URL' && currentView !== 'SERVICE_PARAM_MAPPING'"
        :entityName="currentEntityConfig!.name"
        :fields="currentEntityConfig!.fields"
        :formFields="currentEntityConfig!.formFields"
        :idField="currentEntityConfig!.idField"
        :loadFunction="currentEntityConfig!.loadFunction"
        :createFunction="currentEntityConfig!.createFunction"
        :updateFunction="currentEntityConfig!.updateFunction"
        :deleteFunction="currentEntityConfig!.deleteFunction"
        @openMapping="handleOpenMapping"
        @openRedirectUrls="handleOpenRedirectUrls"
        @openStepServices="handleOpenStepServices"
        @openServiceParams="handleOpenServiceParams"
        @openServiceStepMapping="handleOpenServiceStepMapping"
        :readonly="isReadonly"
        :canDelete="canDelete"
      />
      </main>
    </AuthWrapper>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import AuthWrapper from './components/AuthWrapper.vue';
import { useAuth } from './composables/useAuth';
import EntityManager from './components/EntityManager.vue';
import ServiceImport from './components/ServiceImport.vue';
import RedirectUrlStandalone from './components/RedirectUrlStandalone.vue';
import MappingManagerStandalone from './components/MappingManagerStandalone.vue';
import ServiceParamsStandalone from './components/ServiceParamsStandalone.vue';
import StepServiceMappingStandalone from './components/StepServiceMappingStandalone.vue';
import ServiceStepMappingStandalone from './components/ServiceStepMappingStandalone.vue';

import { getClient, getUserPoolClient } from './client.js';
import * as queries from './graphql/queries';
import * as mutations from './graphql/mutations';

// Use auth composable for permission checking
const { isAdmin, isDeployment, isDeveloper, isReadonly, canEdit, canDelete } = useAuth();

// Initialize client lazily to ensure Amplify is configured first
let client: any = null;
const getClientInstance = () => {
  if (!client) {
    console.log('📱 App.vue requesting client for first time...');
    client = getClient();
  }
  return client;
};

// All the GraphQL operations and entity configurations
const listOriginProducts = async () => {
  const result = await getClientInstance().graphql({ query: queries.listOriginProducts });
  return { data: { listORIGIN_PRODUCTS: result.data.listOrigin_products } };
};

const createOriginProduct = async (input: any) => {
  if (!canEdit.value) throw new Error('Permission denied: Read-only access');
  return await getUserPoolClient().graphql({ query: mutations.createOriginProduct, variables: { input } });
};

const updateOriginProduct = async (input: any) => {
  if (!canEdit.value) throw new Error('Permission denied: Read-only access');
  return await getUserPoolClient().graphql({ query: mutations.updateOriginProduct, variables: { input } });
};

const deleteOriginProduct = async (input: any) => {
  if (!canDelete.value) throw new Error('Permission denied: Delete requires admin or deployment role');
  return await getUserPoolClient().graphql({ query: mutations.deleteOriginProduct, variables: { input } });
};

const listServices = async () => {
  const [servicesResult, providersResult] = await Promise.all([
    getClientInstance().graphql({ query: queries.listServices }),
    getClientInstance().graphql({ query: queries.listServiceProviders })
  ]);
  
  const services = servicesResult.data.listSERVICES.items;
  const providers = providersResult.data.listSERVICE_PROVIDERS.items;
  
  const enhancedServices = services.map(service => {
    const provider = providers.find(p => p.SERVICE_PROVIDER_ID === service.SERVICE_PROVIDER_ID);
    return {
      ...service,
      'Service Provider': provider ? `${provider.SERVICE_PROVIDER_ID}: ${provider.SERVICE_PROVIDER_NAME}` : service.SERVICE_PROVIDER_ID
    };
  });
  
  return { data: { listSERVICES: { items: enhancedServices } } };
};

const createService = async (input: any) => {
  if (!canEdit.value) throw new Error('Permission denied: Read-only access');
  return await getUserPoolClient().graphql({ query: mutations.createService, variables: { input } });
};

const updateService = async (input: any) => {
  if (!canEdit.value) throw new Error('Permission denied: Read-only access');
  return await getUserPoolClient().graphql({ query: mutations.updateService, variables: { input } });
};

const deleteService = async (input: any) => {
  if (!canDelete.value) throw new Error('Permission denied: Delete requires admin or deployment role');
  return await getUserPoolClient().graphql({ query: mutations.deleteService, variables: { input } });
};

// Add all missing entity operations
const listRedirectUrls = async () => {
  const result = await getClientInstance().graphql({ query: queries.listRedirectUrls });
  return { data: { listREDIRECT_URLS: result.data.listRedirect_urls } };
};

const createRedirectUrl = async (input: any) => {
  return await getClientInstance().graphql({ query: mutations.createRedirectUrl, variables: { input } });
};

const updateRedirectUrl = async (input: any) => {
  return await getClientInstance().graphql({ query: mutations.updateRedirectUrl, variables: { input } });
};

const deleteRedirectUrl = async (input: any) => {
  return await getClientInstance().graphql({ query: mutations.deleteRedirectUrl, variables: { input } });
};

const listServiceProviders = async () => {
  const result = await getClientInstance().graphql({ query: queries.listServiceProviders });
  return { data: { listSERVICE_PROVIDERS: result.data.listSERVICE_PROVIDERS } };
};

const createServiceProvider = async (input: any) => {
  if (!canEdit.value) throw new Error('Permission denied: Read-only access');
  return await getUserPoolClient().graphql({ query: mutations.createServiceProvider, variables: { input } });
};

const updateServiceProvider = async (input: any) => {
  if (!canEdit.value) throw new Error('Permission denied: Read-only access');
  return await getUserPoolClient().graphql({ query: mutations.updateServiceProvider, variables: { input } });
};

const deleteServiceProvider = async (input: any) => {
  if (!canDelete.value) throw new Error('Permission denied: Delete requires admin or deployment role');
  return await getUserPoolClient().graphql({ query: mutations.deleteServiceProvider, variables: { input } });
};

const listServiceParams = async () => {
  const result = await getClientInstance().graphql({ query: queries.listServiceParams });
  return { data: { listSERVICE_PARAMS: result.data.listSERVICE_PARAMS } };
};

const createServiceParam = async (input: any) => {
  return await getClientInstance().graphql({ query: mutations.createServiceParam, variables: { input } });
};

const updateServiceParam = async (input: any) => {
  return await getClientInstance().graphql({ query: mutations.updateServiceParam, variables: { input } });
};

const deleteServiceParam = async (input: any) => {
  return await getClientInstance().graphql({ query: mutations.deleteServiceParam, variables: { input } });
};

const listServiceParamMappings = async () => {
  const result = await getClientInstance().graphql({ query: queries.listServiceParamMappings });
  return { data: { listSERVICE_PARAM_MAPPINGS: result.data.listSERVICE_PARAM_MAPPINGS } };
};

const createServiceParamMapping = async (input: any) => {
  return await getClientInstance().graphql({ query: mutations.createServiceParamMapping, variables: { input } });
};

const updateServiceParamMapping = async (input: any) => {
  return await getClientInstance().graphql({ query: mutations.updateServiceParamMapping, variables: { input } });
};

const deleteServiceParamMapping = async (input: any) => {
  return await getClientInstance().graphql({ query: mutations.deleteServiceParamMapping, variables: { input } });
};

const listStepTypes = async () => {
  const result = await getClientInstance().graphql({ query: queries.listStepTypes });
  return { data: { listSTEP_TYPES: result.data.listSTEP_TYPES } };
};

const createStepType = async (input: any) => {
  return await getClientInstance().graphql({ query: mutations.createStepType, variables: { input } });
};

const updateStepType = async (input: any) => {
  return await getClientInstance().graphql({ query: mutations.updateStepType, variables: { input } });
};

const deleteStepType = async (input: any) => {
  return await getClientInstance().graphql({ query: mutations.deleteStepType, variables: { input } });
};

const listStepServiceMappings = async () => {
  const [mappingsResult, stepTypesResult, servicesResult] = await Promise.all([
    getClientInstance().graphql({ query: queries.listStepServiceMappings }),
    getClientInstance().graphql({ query: queries.listStepTypes }),
    getClientInstance().graphql({ query: queries.listServices })
  ]);
  
  const mappings = mappingsResult.data.listSTEP_SERVICE_MAPPINGS.items;
  const stepTypes = stepTypesResult.data.listSTEP_TYPES.items;
  const services = servicesResult.data.listSERVICES.items;
  
  const enhancedMappings = mappings.map(mapping => {
    const stepType = stepTypes.find(st => st.STEP_TYPE_ID === mapping.STEP_TYPE_ID);
    const service = services.find(s => s.SERVICE_ID === mapping.SERVICE_ID);
    return {
      ...mapping,
      'STEP_TYPE': stepType ? `${stepType.STEP_TYPE_ID}: ${stepType.STEP_TYPE_NAME}` : mapping.STEP_TYPE_ID,
      'SERVICE': service ? `${service.SERVICE_ID}: ${service.URI}` : mapping.SERVICE_ID
    };
  });
  
  return { data: { listSTEP_SERVICE_MAPPINGS: { items: enhancedMappings } } };
};

const createStepServiceMapping = async (input: any) => {
  return await getClientInstance().graphql({ query: mutations.createStepServiceMapping, variables: { input } });
};

const updateStepServiceMapping = async (input: any) => {
  return await getClientInstance().graphql({ query: mutations.updateStepServiceMapping, variables: { input } });
};

const deleteStepServiceMapping = async (input: any) => {
  return await getClientInstance().graphql({ query: mutations.deleteStepServiceMapping, variables: { input } });
};

const currentView = ref('import');
const showMappingManager = ref(false);
const showRedirectUrlManager = ref(false);
const showStepServicesManager = ref(false);
const showServiceParamsManager = ref(false);
const showServiceStepMappingManager = ref(false);
const selectedProductId = ref(null);
const selectedStepTypeId = ref(null);
const selectedServiceId = ref(null);

const entities = [
  {
    name: 'ORIGIN_PRODUCT',
    fields: ['ORIGIN_PRODUCT_ID', 'VENDOR_NAME', 'PRODUCT_ID', 'PRODUCT_DESC', 'PSCU_CLIENT_ID', 'PARTNER_CODE', 'CREATED_BY_USER_ID', 'CREATED_DATE', 'CHANGED_BY_USER_ID', 'CHANGED_DATE'],
    formFields: [
      { name: 'VENDOR_NAME', type: 'text', required: true, disabled: false },
      { name: 'PSCU_CLIENT_ID', type: 'number', required: true, disabled: false },
      { name: 'PRODUCT_ID', type: 'text', required: true, disabled: false },
      { name: 'PRODUCT_DESC', type: 'text', required: true, disabled: false },
      { name: 'PARTNER_CODE', type: 'text', required: false, disabled: false },
      { name: 'CREATED_DATE', type: 'date', required: true, disabled: true },
      { name: 'CREATED_BY_USER_ID', type: 'number', required: true, disabled: false }
    ],
    idField: 'ORIGIN_PRODUCT_ID',
    loadFunction: listOriginProducts,
    createFunction: createOriginProduct,
    updateFunction: updateOriginProduct,
    deleteFunction: deleteOriginProduct
  },
  {
    name: 'REDIRECT_URL',
    fields: ['REDIRECT_URL_ID', 'ORIGIN_PRODUCT_ID', 'URL_TYPE_CODE', 'URL', 'RESPONSE_TEXT', 'CREATED_BY_USER_ID', 'CREATED_DATE', 'CHANGED_BY_USER_ID', 'CHANGED_DATE'],
    formFields: [
      { name: 'ORIGIN_PRODUCT_ID', type: 'number', required: true, disabled: false },
      { name: 'URL_TYPE_CODE', type: 'text', required: true, disabled: false },
      { name: 'URL', type: 'text', required: true, disabled: false },
      { name: 'RESPONSE_TEXT', type: 'text', required: false, disabled: false },
      { name: 'CREATED_BY_USER_ID', type: 'number', required: true, disabled: false },
      { name: 'CREATED_DATE', type: 'date', required: true, disabled: true }
    ],
    idField: 'REDIRECT_URL_ID',
    loadFunction: listRedirectUrls,
    createFunction: createRedirectUrl,
    updateFunction: updateRedirectUrl,
    deleteFunction: deleteRedirectUrl
  },
  {
    name: 'SERVICE_PROVIDER',
    fields: ['SERVICE_PROVIDER_ID', 'SERVICE_PROVIDER_NAME', 'CREATED_BY_USER_ID', 'CREATED_DATE', 'CHANGED_BY_USER_ID', 'CHANGED_DATE'],
    formFields: [
      { name: 'SERVICE_PROVIDER_NAME', type: 'text', required: true, disabled: false },
      { name: 'CREATED_BY_USER_ID', type: 'number', required: true, disabled: false },
      { name: 'CREATED_DATE', type: 'date', required: true, disabled: true }
    ],
    idField: 'SERVICE_PROVIDER_ID',
    loadFunction: listServiceProviders,
    createFunction: createServiceProvider,
    updateFunction: updateServiceProvider,
    deleteFunction: deleteServiceProvider
  },
  {
    name: 'SERVICE',
    fields: ['SERVICE_ID', 'Service Provider', 'URI', 'CREATED_BY_USER_ID', 'CREATED_DATE', 'CHANGED_BY_USER_ID', 'CHANGED_DATE'],
    formFields: [
      { name: 'SERVICE_PROVIDER_ID', type: 'select', required: true, disabled: false, options: [] },
      { name: 'URI', type: 'text', required: true, disabled: false },
      { name: 'CREATED_BY_USER_ID', type: 'number', required: true, disabled: false },
      { name: 'CREATED_DATE', type: 'date', required: true, disabled: true }
    ],
    idField: 'SERVICE_ID',
    loadFunction: listServices,
    createFunction: createService,
    updateFunction: updateService,
    deleteFunction: deleteService
  },
  {
    name: 'SERVICE_PARAM',
    fields: ['SERVICE_PARAM_ID', 'SERVICE_ID', 'PARAM_NAME', 'CREATED_BY_USER_ID', 'CREATED_DATE', 'CHANGED_BY_USER_ID', 'CHANGED_DATE'],
    formFields: [
      { name: 'SERVICE_ID', type: 'select', required: true, disabled: false, options: [] },
      { name: 'PARAM_NAME', type: 'text', required: true, disabled: false },
      { name: 'CREATED_BY_USER_ID', type: 'number', required: true, disabled: false },
      { name: 'CREATED_DATE', type: 'date', required: true, disabled: true }
    ],
    idField: 'SERVICE_PARAM_ID',
    loadFunction: listServiceParams,
    createFunction: createServiceParam,
    updateFunction: updateServiceParam,
    deleteFunction: deleteServiceParam
  },
  {
    name: 'SERVICE_PARAM_MAPPING',
    fields: ['SERVICE_PARAM_MAPPING_ID', 'ORIGIN_PRODUCT_ID', 'SOURCE_SERVICE_PARAM_ID', 'TARGET_SERVICE_PARAM_ID', 'CREATED_BY_USER_ID', 'CREATED_DATE'],
    formFields: [
      { name: 'ORIGIN_PRODUCT_ID', type: 'number', required: true, disabled: false },
      { name: 'SYSTEM_NBR', type: 'text', required: false, disabled: false },
      { name: 'PRIN_NBR', type: 'text', required: false, disabled: false },
      { name: 'AGENT_NBR', type: 'text', required: false, disabled: false },
      { name: 'SOURCE_SERVICE_PARAM_ID', type: 'number', required: true, disabled: false },
      { name: 'TARGET_SERVICE_PARAM_ID', type: 'number', required: true, disabled: false },
      { name: 'CREATED_BY_USER_ID', type: 'number', required: true, disabled: false },
      { name: 'CREATED_DATE', type: 'date', required: true, disabled: true }
    ],
    idField: 'SERVICE_PARAM_MAPPING_ID',
    loadFunction: listServiceParamMappings,
    createFunction: createServiceParamMapping,
    updateFunction: updateServiceParamMapping,
    deleteFunction: deleteServiceParamMapping
  },
  {
    name: 'STEP_TYPE',
    fields: ['STEP_TYPE_ID', 'STEP_TYPE_NAME', 'STEP_TYPE_DESC', 'RESOURCE_NAME', 'CREATED_BY_USER_ID', 'CREATED_DATE', 'CHANGED_BY_USER_ID', 'CHANGED_DATE'],
    formFields: [
      { name: 'STEP_TYPE_NAME', type: 'text', required: true, disabled: false },
      { name: 'STEP_TYPE_DESC', type: 'text', required: false, disabled: false },
      { name: 'RESOURCE_NAME', type: 'text', required: true, disabled: false },
      { name: 'CREATED_BY_USER_ID', type: 'number', required: true, disabled: false },
      { name: 'CREATED_DATE', type: 'date', required: true, disabled: true }
    ],
    idField: 'STEP_TYPE_ID',
    loadFunction: listStepTypes,
    createFunction: createStepType,
    updateFunction: updateStepType,
    deleteFunction: deleteStepType
  },
  {
    name: 'STEP_SERVICE_MAPPING',
    fields: ['STEP_SERVICE_MAPPING_ID', 'STEP_TYPE', 'SERVICE', 'SEQUENCE_NBR'],
    formFields: [
      { name: 'STEP_TYPE_ID', type: 'select', required: true, disabled: false, options: [] },
      { name: 'SERVICE_ID', type: 'select', required: true, disabled: false, options: [] },
      { name: 'SEQUENCE_NBR', type: 'number', required: false, disabled: false }
    ],
    idField: 'STEP_SERVICE_MAPPING_ID',
    loadFunction: listStepServiceMappings,
    createFunction: createStepServiceMapping,
    updateFunction: updateStepServiceMapping,
    deleteFunction: deleteStepServiceMapping
  }
];

const sortedEntities = computed(() => {
  return [...entities].sort((a, b) => a.name.localeCompare(b.name));
});

const currentEntityConfig = computed(() => {
  return entities.find(entity => entity.name === currentView.value) || null;
});

const changeView = () => {
  console.log(`Changed to view: ${currentView.value}`);
};

const closeMappingManager = () => {
  showMappingManager.value = false;
  selectedProductId.value = null;
};

const closeRedirectUrlManager = () => {
  showRedirectUrlManager.value = false;
  selectedProductId.value = null;
};

const closeStepServicesManager = () => {
  showStepServicesManager.value = false;
  selectedStepTypeId.value = null;
};

const closeServiceParamsManager = () => {
  showServiceParamsManager.value = false;
  selectedServiceId.value = null;
};

const closeServiceStepMappingManager = () => {
  showServiceStepMappingManager.value = false;
  selectedServiceId.value = null;
};

const handleOpenMapping = (data) => {
  selectedProductId.value = data.productId;
  showMappingManager.value = true;
};

const handleOpenRedirectUrls = (data) => {
  selectedProductId.value = data.productId;
  showRedirectUrlManager.value = true;
};

const handleOpenStepServices = (data) => {
  selectedStepTypeId.value = data.stepTypeId;
  showStepServicesManager.value = true;
};

const handleOpenServiceParams = (data) => {
  selectedServiceId.value = data.serviceId;
  showServiceParamsManager.value = true;
};

const handleOpenServiceStepMapping = (data) => {
  selectedServiceId.value = data.serviceId;
  showServiceStepMappingManager.value = true;
};

onMounted(() => {
  currentView.value = 'import';
});
</script>

<style>
#app {
  font-family: Arial, sans-serif;
  width: 100%;
  min-height: 100vh;
  margin: 0;
  padding: 20px;
  box-sizing: border-box;
}

header {
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
}

select {
  padding: 8px;
  font-size: 16px;
}

main {
  background-color: #f9f9f9;
  width: 100%;
  min-height: calc(100vh - 120px);
  overflow: auto;
  padding: 20px;
  box-sizing: border-box;
}

/* Shared button styles */
.sticky-buttons {
  position: sticky;
  top: 0;
  background: white;
  z-index: 25;
  margin-bottom: 10px;
  padding: 10px 0;
}

.btn-primary {
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 12px;
  cursor: pointer;
  margin-right: 10px;
}

.btn-primary:hover {
  background: #0056b3;
}

.btn-primary:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.btn-success {
  background: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 12px;
  cursor: pointer;
  margin-right: 10px;
}

.btn-success:hover {
  background: #218838;
}

.btn-danger {
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 3px;
}

.btn-danger:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.btn-danger:hover:not(:disabled) {
  background: #c82333;
}
</style>