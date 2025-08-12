<template>
  <div id="app">
    <header>
      <h1>GraphQL API Manager</h1>
      <nav>
        <select v-model="currentView" @change="changeView" :disabled="showMappingManager">
          <option value="import">Import Services</option>
          <option v-for="entity in entities" :key="entity.name" :value="entity.name">
            {{ entity.name }}
          </option>
        </select>
        <button v-if="showMappingManager" @click="closeMappingManager" class="btn-primary" style="margin-left: 10px;">
          Back to {{ currentView }}
        </button>
      </nav>
    </header>
    
    <main>
      <MappingManager v-if="showMappingManager" :productId="selectedProductId" />
      <ServiceImport v-else-if="currentView === 'import'" />
      <EntityManager
        v-else-if="currentView && currentEntityConfig"
        :entityName="currentEntityConfig!.name"
        :fields="currentEntityConfig!.fields"
        :formFields="currentEntityConfig!.formFields"
        :idField="currentEntityConfig!.idField"
        :loadFunction="currentEntityConfig!.loadFunction"
        :createFunction="currentEntityConfig!.createFunction"
        :updateFunction="currentEntityConfig!.updateFunction"
        :deleteFunction="currentEntityConfig!.deleteFunction"
      />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import EntityManager from './components/EntityManager.vue';
import ServiceImport from './components/ServiceImport.vue';
import MappingManager from './components/MappingManager.vue';
import { generateClient } from 'aws-amplify/api';
import { Amplify } from 'aws-amplify';
import * as queries from './graphql/queries';
import * as mutations from './graphql/mutations';

// Configure Amplify
Amplify.configure({
  API: {
    GraphQL: {
      endpoint: 'https://fi5pjed64nf4ran34tusrlvi7u.appsync-api.us-east-2.amazonaws.com/graphql',
      region: 'us-east-2',
      defaultAuthMode: 'apiKey',
      apiKey: 'da2-qfwm2qhugrbilizrqickmeg5oi'
    }
  }
});

const client = generateClient();

const listOriginProducts = async () => {
  const result = await client.graphql({ query: queries.listOriginProducts });
  return { data: { listORIGIN_PRODUCTS: result.data.listOrigin_products } };
};

const createOriginProduct = async (input: any) => {
  return await client.graphql({ query: mutations.createOriginProduct, variables: { input } });
};

const updateOriginProduct = async (input: any) => {
  return await client.graphql({ query: mutations.updateOriginProduct, variables: { input } });
};

const deleteOriginProduct = async (input: any) => {
  return await client.graphql({ query: mutations.deleteOriginProduct, variables: { input } });
};

const listRedirectUrls = async () => {
  const result = await client.graphql({ query: queries.listRedirectUrls });
  return { data: { listREDIRECT_URLS: result.data.listRedirect_urls } };
};

const createRedirectUrl = async (input: any) => {
  return await client.graphql({ query: mutations.createRedirectUrl, variables: { input } });
};

const updateRedirectUrl = async (input: any) => {
  return await client.graphql({ query: mutations.updateRedirectUrl, variables: { input } });
};

const deleteRedirectUrl = async (input: any) => {
  return await client.graphql({ query: mutations.deleteRedirectUrl, variables: { input } });
};

const listServiceProviders = async () => {
  const result = await client.graphql({ query: queries.listServiceProviders });
  return { data: { listSERVICE_PROVIDERS: result.data.listSERVICE_PROVIDERS } };
};

const createServiceProvider = async (input: any) => {
  return await client.graphql({ query: mutations.createServiceProvider, variables: { input } });
};

const updateServiceProvider = async (input: any) => {
  return await client.graphql({ query: mutations.updateServiceProvider, variables: { input } });
};

const deleteServiceProvider = async (input: any) => {
  return await client.graphql({ query: mutations.deleteServiceProvider, variables: { input } });
};

const listServices = async () => {
  const [servicesResult, providersResult] = await Promise.all([
    client.graphql({ query: queries.listServices }),
    client.graphql({ query: queries.listServiceProviders })
  ]);
  
  const services = servicesResult.data.listSERVICES.items;
  const providers = providersResult.data.listSERVICE_PROVIDERS.items;
  
  // Add Service Provider display field
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
  return await client.graphql({ query: mutations.createService, variables: { input } });
};

const updateService = async (input: any) => {
  return await client.graphql({ query: mutations.updateService, variables: { input } });
};

const deleteService = async (input: any) => {
  // Check if service has associated parameters
  const paramsResult = await client.graphql({ query: queries.listServiceParams });
  const hasParams = paramsResult.data.listSERVICE_PARAMS.items.some(
    (param: any) => param.SERVICE_ID === input.SERVICE_ID
  );
  
  if (hasParams) {
    throw new Error('Cannot delete service: it has associated parameters');
  }
  
  return await client.graphql({ query: mutations.deleteService, variables: { input } });
};

const listServiceParams = async () => {
  const result = await client.graphql({ query: queries.listServiceParams });
  return { data: { listSERVICE_PARAMS: result.data.listSERVICE_PARAMS } };
};

const createServiceParam = async (input: any) => {
  return await client.graphql({ query: mutations.createServiceParam, variables: { input } });
};

const updateServiceParam = async (input: any) => {
  return await client.graphql({ query: mutations.updateServiceParam, variables: { input } });
};

const deleteServiceParam = async (input: any) => {
  // Check if parameter has associated mappings
  const mappingsResult = await client.graphql({ query: queries.listServiceParamMappings });
  const hasMappings = mappingsResult.data.listSERVICE_PARAM_MAPPINGS.items.some(
    (mapping: any) => mapping.SOURCE_SERVICE_PARAM_ID === input.SERVICE_PARAM_ID || 
                     mapping.TARGET_SERVICE_PARAM_ID === input.SERVICE_PARAM_ID
  );
  
  if (hasMappings) {
    throw new Error('Cannot delete parameter: it has associated mappings');
  }
  
  return await client.graphql({ query: mutations.deleteServiceParam, variables: { input } });
};

const listServiceParamMappings = async () => {
  const result = await client.graphql({ query: queries.listServiceParamMappings });
  return { data: { listSERVICE_PARAM_MAPPINGS: result.data.listSERVICE_PARAM_MAPPINGS } };
};

const createServiceParamMapping = async (input: any) => {
  return await client.graphql({ query: mutations.createServiceParamMapping, variables: { input } });
};

const updateServiceParamMapping = async (input: any) => {
  return await client.graphql({ query: mutations.updateServiceParamMapping, variables: { input } });
};

const deleteServiceParamMapping = async (input: any) => {
  return await client.graphql({ query: mutations.deleteServiceParamMapping, variables: { input } });
};

const listServiceExprMappings = async () => {
  const result = await client.graphql({ query: queries.listServiceExprMappings });
  return { data: { listSERVICE_EXPR_MAPPINGS: result.data.listSERVICE_EXPR_MAPPINGS } };
};

const createServiceExprMapping = async (input: any) => {
  return await client.graphql({ query: mutations.createServiceExprMapping, variables: { input } });
};

const updateServiceExprMapping = async (input: any) => {
  return await client.graphql({ query: mutations.updateServiceExprMapping, variables: { input } });
};

const deleteServiceExprMapping = async (input: any) => {
  return await client.graphql({ query: mutations.deleteServiceExprMapping, variables: { input } });
};

const listStepTypes = async () => {
  const result = await client.graphql({ query: queries.listStepTypes });
  return { data: { listSTEP_TYPES: result.data.listSTEP_TYPES } };
};

const createStepType = async (input: any) => {
  return await client.graphql({ query: mutations.createStepType, variables: { input } });
};

const updateStepType = async (input: any) => {
  return await client.graphql({ query: mutations.updateStepType, variables: { input } });
};

const deleteStepType = async (input: any) => {
  return await client.graphql({ query: mutations.deleteStepType, variables: { input } });
};

const listStepServiceMappings = async () => {
  const [mappingsResult, stepTypesResult, servicesResult] = await Promise.all([
    client.graphql({ query: queries.listStepServiceMappings }),
    client.graphql({ query: queries.listStepTypes }),
    client.graphql({ query: queries.listServices })
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
      'Step Type': stepType ? `${stepType.STEP_TYPE_ID}: ${stepType.STEP_TYPE_NAME}` : mapping.STEP_TYPE_ID,
      'Service': service ? `${service.SERVICE_ID}: ${service.URI}` : mapping.SERVICE_ID
    };
  });
  
  return { data: { listSTEP_SERVICE_MAPPINGS: { items: enhancedMappings } } };
};

const createStepServiceMapping = async (input: any) => {
  return await client.graphql({ query: mutations.createStepServiceMapping, variables: { input } });
};

const updateStepServiceMapping = async (input: any) => {
  return await client.graphql({ query: mutations.updateStepServiceMapping, variables: { input } });
};

const deleteStepServiceMapping = async (input: any) => {
  return await client.graphql({ query: mutations.deleteStepServiceMapping, variables: { input } });
};

const listServiceParamMappingsView = async () => {
  const result = await client.graphql({ query: queries.listServiceParamMappingsView });
  return { data: { listService_param_mappings: result.data.listService_param_mappings } };
};

const currentView = ref('import');
const showMappingManager = ref(false);
const selectedProductId = ref(null);

const entities = [
  {
    name: 'ORIGIN_PRODUCT',
    fields: ['ORIGIN_PRODUCT_ID', 'VENDOR_NAME', 'PRODUCT_ID', 'PRODUCT_DESC', 'PSCU_CLIENT_ID', 'PARTNER_CODE'],
    formFields: [
      { name: 'VENDOR_NAME', type: 'text', required: true, disabled: false },
      { name: 'PSCU_CLIENT_ID', type: 'number', required: true, disabled: false },
      { name: 'PRODUCT_ID', type: 'text', required: true, disabled: false },
      { name: 'PRODUCT_DESC', type: 'text', required: true, disabled: false },
      { name: 'PARTNER_CODE', type: 'text', required: false, disabled: false },
      { name: 'CREATED_DATE', type: 'date', required: true, disabled: false },
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
    fields: ['REDIRECT_URL_ID', 'ORIGIN_PRODUCT_ID', 'URL_TYPE_CODE', 'URL', 'RESPONSE_TEXT', 'PRODUCT_ID', 'VENDOR_NAME'],
    formFields: [
      { name: 'ORIGIN_PRODUCT_ID', type: 'number', required: true, disabled: false },
      { name: 'URL_TYPE_CODE', type: 'text', required: true, disabled: false },
      { name: 'URL', type: 'text', required: true, disabled: false },
      { name: 'RESPONSE_TEXT', type: 'text', required: false, disabled: false },
      { name: 'CREATED_BY_USER_ID', type: 'number', required: true, disabled: false },
      { name: 'CREATED_DATE', type: 'date', required: true, disabled: false }
    ],
    idField: 'REDIRECT_URL_ID',
    loadFunction: listRedirectUrls,
    createFunction: createRedirectUrl,
    updateFunction: updateRedirectUrl,
    deleteFunction: deleteRedirectUrl
  },
  {
    name: 'SERVICE_PROVIDER',
    fields: ['SERVICE_PROVIDER_ID', 'SERVICE_PROVIDER_NAME', 'CREATED_DATE'],
    formFields: [
      { name: 'SERVICE_PROVIDER_NAME', type: 'text', required: true, disabled: false },
      { name: 'CREATED_BY_USER_ID', type: 'number', required: true, disabled: false },
      { name: 'CREATED_DATE', type: 'date', required: true, disabled: false }
    ],
    idField: 'SERVICE_PROVIDER_ID',
    loadFunction: listServiceProviders,
    createFunction: createServiceProvider,
    updateFunction: updateServiceProvider,
    deleteFunction: deleteServiceProvider
  },
  {
    name: 'SERVICE',
    fields: ['SERVICE_ID', 'Service Provider', 'URI', 'CREATED_DATE'],
    formFields: [
      { name: 'SERVICE_PROVIDER_ID', type: 'select', required: true, disabled: false, options: [] },
      { name: 'URI', type: 'text', required: true, disabled: false },
      { name: 'CREATED_BY_USER_ID', type: 'number', required: true, disabled: false },
      { name: 'CREATED_DATE', type: 'date', required: true, disabled: false }
    ],
    idField: 'SERVICE_ID',
    loadFunction: listServices,
    createFunction: createService,
    updateFunction: updateService,
    deleteFunction: deleteService
  },
  {
    name: 'SERVICE_PARAM',
    fields: ['SERVICE_PARAM_ID', 'SERVICE_ID', 'PARAM_NAME', 'CREATED_DATE'],
    formFields: [
      { name: 'SERVICE_ID', type: 'select', required: true, disabled: false, options: [] },
      { name: 'PARAM_NAME', type: 'text', required: true, disabled: false },
      { name: 'CREATED_BY_USER_ID', type: 'number', required: true, disabled: false },
      { name: 'CREATED_DATE', type: 'date', required: true, disabled: false }
    ],
    idField: 'SERVICE_PARAM_ID',
    loadFunction: listServiceParams,
    createFunction: createServiceParam,
    updateFunction: updateServiceParam,
    deleteFunction: deleteServiceParam
  },
  {
    name: 'SERVICE_PARAM_MAPPING',
    fields: ['SERVICE_PARAM_MAPPING_ID', 'ORIGIN_PRODUCT_ID', 'SOURCE_SERVICE_PARAM_ID', 'TARGET_SERVICE_PARAM_ID'],
    formFields: [
      { name: 'ORIGIN_PRODUCT_ID', type: 'number', required: true, disabled: false },
      { name: 'SYSTEM_NBR', type: 'text', required: false, disabled: false },
      { name: 'PRIN_NBR', type: 'text', required: false, disabled: false },
      { name: 'AGENT_NBR', type: 'text', required: false, disabled: false },
      { name: 'SOURCE_SERVICE_PARAM_ID', type: 'number', required: true, disabled: false },
      { name: 'TARGET_SERVICE_PARAM_ID', type: 'number', required: true, disabled: false },
      { name: 'PLASTIC_TYPE_ID', type: 'text', required: false, disabled: false },
      { name: 'COMMENT_TEXT', type: 'text', required: false, disabled: false },
      { name: 'CREATED_BY_USER_ID', type: 'number', required: true, disabled: false },
      { name: 'CREATED_DATE', type: 'date', required: true, disabled: false }
    ],
    idField: 'SERVICE_PARAM_MAPPING_ID',
    loadFunction: listServiceParamMappings,
    createFunction: createServiceParamMapping,
    updateFunction: updateServiceParamMapping,
    deleteFunction: deleteServiceParamMapping
  },
  {
    name: 'SERVICE_EXPR_MAPPING',
    fields: ['SERVICE_EXPR_MAPPING_ID', 'SERVICE_PARAM_MAPPING_ID', 'SOURCE_EXPR', 'TARGET_EXPR'],
    formFields: [
      { name: 'SERVICE_PARAM_MAPPING_ID', type: 'number', required: true, disabled: false },
      { name: 'SOURCE_EXPR', type: 'text', required: false, disabled: false },
      { name: 'TARGET_EXPR', type: 'text', required: false, disabled: false },
      { name: 'COMMENT_TEXT', type: 'text', required: false, disabled: false },
      { name: 'CREATED_BY_USER_ID', type: 'number', required: true, disabled: false },
      { name: 'CREATED_DATE', type: 'date', required: true, disabled: false }
    ],
    idField: 'SERVICE_EXPR_MAPPING_ID',
    loadFunction: listServiceExprMappings,
    createFunction: createServiceExprMapping,
    updateFunction: updateServiceExprMapping,
    deleteFunction: deleteServiceExprMapping
  },
  {
    name: 'STEP_TYPE',
    fields: ['STEP_TYPE_ID', 'STEP_TYPE_NAME', 'STEP_TYPE_DESC', 'RESOURCE_NAME'],
    formFields: [
      { name: 'STEP_TYPE_NAME', type: 'text', required: true, disabled: false },
      { name: 'STEP_TYPE_DESC', type: 'text', required: false, disabled: false },
      { name: 'RESOURCE_NAME', type: 'text', required: true, disabled: false },
      { name: 'CREATED_BY_USER_ID', type: 'number', required: true, disabled: false },
      { name: 'CREATED_DATE', type: 'date', required: true, disabled: false }
    ],
    idField: 'STEP_TYPE_ID',
    loadFunction: listStepTypes,
    createFunction: createStepType,
    updateFunction: updateStepType,
    deleteFunction: deleteStepType
  },
  {
    name: 'STEP_SERVICE_MAPPING',
    fields: ['STEP_SERVICE_MAPPING_ID', 'Step Type', 'Service', 'SEQUENCE_NBR'],
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
  },
  {
    name: 'SERVICE_PARAM_MAPPINGS_VIEW',
    fields: ['SERVICE_PARAM_MAPPING_ID', 'VENDOR_NAME', 'PRODUCT_DESC', 'SOURCE_PROVIDER_NAME', 'TARGET_PROVIDER_NAME'],
    formFields: [],
    idField: 'SERVICE_PARAM_MAPPING_ID',
    loadFunction: listServiceParamMappingsView,
    createFunction: () => ({}),
    updateFunction: () => ({}),
    deleteFunction: () => ({})
  }
];

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

const handleOpenMapping = (event) => {
  selectedProductId.value = event.detail.productId;
  showMappingManager.value = true;
};

onMounted(() => {
  // Default to import view
  currentView.value = 'import';
  
  // Listen for mapping events
  window.addEventListener('openMapping', handleOpenMapping);
});
</script>

<style>
#app {
  font-family: Arial, sans-serif;
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

header {
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

select {
  padding: 8px;
  font-size: 16px;
}

main {
  background-color: #f9f9f9;
  width: 100%;
  height: calc(100vh - 80px);
  overflow: hidden;
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