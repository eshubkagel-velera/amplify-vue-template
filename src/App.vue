<template>
  <div id="app">
    <AuthLogin v-if="!isAuthenticated" @authenticated="handleAuthenticated" />
    <div v-else>
      <div style="height: 125px;"></div>
      <header>
      <nav>
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
      <div style="position: fixed; top: 0; left: 0; right: 0; display: flex; flex-direction: column; background: var(--bg-color, #fff); z-index: 1000; padding: 10px; border-bottom: 1px solid var(--border-color, #dee2e6);">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="flex: 1; text-align: center;">
            <h1 style="margin: 0; font-size: 2rem;">Hazel Mapping Editor</h1>
            <h2 style="margin: 30px 0 0 0; font-size: 1.2rem; color: var(--text-color, #666);">{{ currentView === 'import' ? 'Import Services' : currentView + ' Manager' }}</h2>
          </div>
          <div style="display: flex; gap: 10px; flex-direction: column; align-items: flex-end;">
            <div style="display: flex; gap: 10px;">
              <ThemeToggle />
              <button @click="signOut" class="btn-danger">
                Sign Out
              </button>
            </div>
            <div class="controls-right" style="position: relative; top: 0;">
              <div class="user-info-section">
                <label>User:</label>
                <span class="user-info">{{ user?.email }} ({{ filteredUserGroups.join(', ') }})</span>
              </div>
              <EnvironmentSelector />
              <div class="screen-selector">
                <label for="screen-select">Screen:</label>
                <select id="screen-select" v-model="currentView" @change="changeView" :disabled="showMappingManager || showRedirectUrlManager || showStepServicesManager || showServiceParamsManager || showServiceStepMappingManager">
                  <option v-for="entity in sortedEntities" :key="entity.name" :value="entity.name">
                    {{ entity.name }}
                  </option>
                  <option value="import">Import Services</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import AuthLogin from './components/AuthLogin.vue';
import EnvironmentSelector from './components/EnvironmentSelector.vue';
import { useAuth } from './composables/useAuth';
import { getCurrentUser, signOut as cognitoSignOut } from 'aws-amplify/auth';

// Authentication state
const isAuthenticated = ref(false);
let inactivityTimer = null;

const checkAuthState = async () => {
  try {
    await getCurrentUser();
    isAuthenticated.value = true;
    startInactivityTimer();
  } catch {
    isAuthenticated.value = false;
  }
};

const startInactivityTimer = () => {
  clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(async () => {
    console.log('Auto-logout due to inactivity');
    await signOut();
  }, 30 * 60 * 1000); // 30 minutes
};

const resetInactivityTimer = () => {
  if (isAuthenticated.value) {
    startInactivityTimer();
  }
};

const handleAuthenticated = () => {
  isAuthenticated.value = true;
  loadUserInfo();
  startInactivityTimer();
};

const signOut = async () => {
  try {
    clearTimeout(inactivityTimer);
    await cognitoSignOut();
    isAuthenticated.value = false;
    user.value = null;
    userGroups.value = [];
  } catch (err) {
    console.error('Sign out error:', err);
  }
};

// User info refs
const user = ref(null);
const userGroups = ref([]);

// Load user info
const loadUserInfo = async () => {
  try {
    const { fetchAuthSession, fetchUserAttributes } = await import('aws-amplify/auth');
    const session = await fetchAuthSession();
    const accessToken = session.tokens?.accessToken;
    
    // Get user attributes including email
    const userAttributes = await fetchUserAttributes();
    
    if (accessToken?.payload) {
      user.value = {
        email: userAttributes.email || accessToken.payload.email || accessToken.payload.username,
        username: accessToken.payload.username
      };
      
      if (accessToken.payload['cognito:groups']) {
        userGroups.value = accessToken.payload['cognito:groups'];
        console.log('Setting user groups:', userGroups.value);
        
        // Update the global auth state
        const { useAuth } = await import('./composables/useAuth');
        const { setUserGroups } = useAuth();
        setUserGroups(userGroups.value);
      }
    }
  } catch (err) {
    console.warn('Could not load user info:', err);
  }
};
import EntityManager from './components/EntityManager.vue';
import ServiceImport from './components/ServiceImport.vue';
import RedirectUrlStandalone from './components/RedirectUrlStandalone.vue';
import MappingManagerStandalone from './components/MappingManagerStandalone.vue';
import ServiceParamsStandalone from './components/ServiceParamsStandalone.vue';
import StepServiceMappingStandalone from './components/StepServiceMappingStandalone.vue';
import ServiceStepMappingStandalone from './components/ServiceStepMappingStandalone.vue';
import ThemeToggle from './components/ThemeToggle.vue';

import { getClient, getUserPoolClient } from './client.js';
import * as queries from './graphql/queries';
import * as mutations from './graphql/mutations';
import { fetchAllPages } from './utils/pagination.js';

// Use auth composable for permission checking
const { isAdmin, isDeployment, isDeveloper, isReadonly, canEdit, canDelete, userGroups: filteredUserGroups } = useAuth();

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
  const items = await fetchAllPages(getClientInstance(), queries.listOriginProducts, {}, 'listORIGIN_PRODUCTS');
  return {
    data: {
      listORIGIN_PRODUCTS: {
        items
      }
    }
  };
};

const createOriginProduct = async (input: any) => {
  if (!canEdit.value) throw new Error('Permission denied: Read-only access');
  return await getClientInstance().graphql({ query: mutations.createOriginProduct, variables: { input } });
};

const updateOriginProduct = async (input: any) => {
  if (!canEdit.value) throw new Error('Permission denied: Read-only access');
  return await getClientInstance().graphql({ query: mutations.updateOriginProduct, variables: { input } });
};

const deleteOriginProduct = async (input: any) => {
  if (!canDelete.value) throw new Error('Permission denied: Delete requires admin or deployment role');
  return await getClientInstance().graphql({ query: mutations.deleteOriginProduct, variables: { input } });
};



const createService = async (input: any) => {
  if (!canEdit.value) throw new Error('Permission denied: Read-only access');
  return await getClientInstance().graphql({ query: mutations.createService, variables: { input } });
};

const updateService = async (input: any) => {
  if (!canEdit.value) throw new Error('Permission denied: Read-only access');
  return await getClientInstance().graphql({ query: mutations.updateService, variables: { input } });
};

const deleteService = async (input: any) => {
  if (!canDelete.value) throw new Error('Permission denied: Delete requires admin or deployment role');
  return await getClientInstance().graphql({ query: mutations.deleteService, variables: { input } });
};

// Add all missing entity operations

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
  const items = await fetchAllPages(getClientInstance(), queries.listServiceProviders, {}, 'listSERVICE_PROVIDERS');
  return {
    data: {
      listSERVICE_PROVIDERS: {
        items
      }
    }
  };
};

const listServices = async () => {
  const [services, providers] = await Promise.all([
    fetchAllPages(getClientInstance(), queries.listServices, {}, 'listSERVICES'),
    fetchAllPages(getClientInstance(), queries.listServiceProviders, {}, 'listSERVICE_PROVIDERS')
  ]);
  
  const enhancedServices = services.map(service => {
    const provider = providers.find(p => p.SERVICE_PROVIDER_ID === service.SERVICE_PROVIDER_ID);
    return {
      ...service,
      'Service Provider': provider ? `${provider.SERVICE_PROVIDER_ID}: ${provider.SERVICE_PROVIDER_NAME}` : service.SERVICE_PROVIDER_ID
    };
  });
  
  return { data: { listSERVICES: { items: enhancedServices } } };
};

const createServiceProvider = async (input: any) => {
  if (!canEdit.value) throw new Error('Permission denied: Read-only access');
  return await getClientInstance().graphql({ query: mutations.createServiceProvider, variables: { input } });
};

const updateServiceProvider = async (input: any) => {
  if (!canEdit.value) throw new Error('Permission denied: Read-only access');
  return await getClientInstance().graphql({ query: mutations.updateServiceProvider, variables: { input } });
};

const deleteServiceProvider = async (input: any) => {
  if (!canDelete.value) throw new Error('Permission denied: Delete requires admin or deployment role');
  return await getClientInstance().graphql({ query: mutations.deleteServiceProvider, variables: { input } });
};

const listServiceParams = async () => {
  const items = await fetchAllPages(getClientInstance(), queries.listServiceParams, {}, 'listSERVICE_PARAMS');
  return {
    data: {
      listSERVICE_PARAMS: {
        items
      }
    }
  };
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
  const items = await fetchAllPages(getClientInstance(), queries.listServiceParamMappings, {}, 'listSERVICE_PARAM_MAPPINGS');
  return {
    data: {
      listSERVICE_PARAM_MAPPINGS: {
        items
      }
    }
  };
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

const listRedirectUrls = async () => {
  const items = await fetchAllPages(getClientInstance(), queries.listRedirectUrls, {}, 'listREDIRECT_URLS');
  return {
    data: {
      listREDIRECT_URLS: {
        items
      }
    }
  };
};

const listStepServiceMappings = async () => {
  const [mappings, stepTypes, services] = await Promise.all([
    fetchAllPages(getClientInstance(), queries.listStepServiceMappings, {}, 'listSTEP_SERVICE_MAPPINGS'),
    fetchAllPages(getClientInstance(), queries.listStepTypes, {}, 'listSTEP_TYPES'),
    fetchAllPages(getClientInstance(), queries.listServices, {}, 'listSERVICES')
  ]);
  
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

const listStepTypes = async () => {
  const items = await fetchAllPages(getClientInstance(), queries.listStepTypes, {}, 'listSTEP_TYPES');
  return {
    data: {
      listSTEP_TYPES: {
        items
      }
    }
  };
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
    fields: ['SERVICE_ID', 'Service Provider', 'URI', 'SECRET_NAME', 'REQUEST_TYPE', 'CREATED_BY_USER_ID', 'CREATED_DATE', 'CHANGED_BY_USER_ID', 'CHANGED_DATE'],
    formFields: [
      { name: 'SERVICE_PROVIDER_ID', type: 'select', required: true, disabled: false, options: [] },
      { name: 'URI', type: 'text', required: true, disabled: false },
      { name: 'SECRET_NAME', type: 'text', required: false, disabled: false },
      { name: 'REQUEST_TYPE', type: 'select', required: false, disabled: false, options: [
        { value: 'get', label: 'GET' },
        { value: 'post', label: 'POST' },
        { value: 'put', label: 'PUT' },
        { value: 'delete', label: 'DELETE' }
      ] },
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

// Watch for environment changes and trigger refresh
const environmentChangeKey = ref(0);
watch(() => localStorage.getItem('selectedEnvironment'), () => {
  environmentChangeKey.value++;
}, { immediate: false });

// Add environment reactivity to entity configs
const getReactiveEntityConfig = (entityName) => {
  const baseConfig = entities.find(entity => entity.name === entityName);
  if (!baseConfig) return null;
  
  // Force reactivity by including environmentChangeKey
  environmentChangeKey.value; // This makes the computed reactive to environment changes
  return baseConfig;
};

const currentEntityConfig = computed(() => {
  return getReactiveEntityConfig(currentView.value);
});

onMounted(async () => {
  currentView.value = 'import';
  await checkAuthState();
  if (isAuthenticated.value) {
    await loadUserInfo();
  }
  
  // Add activity listeners to reset inactivity timer
  const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
  events.forEach(event => {
    document.addEventListener(event, resetInactivityTimer, true);
  });
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

.controls-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 15px;
}

.header-title {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
}

.controls-right {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.user-info-section,
.environment-selector,
.screen-selector {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: var(--bg-color, #fff);
  border: 1px solid var(--border-color, #dee2e6);
  border-radius: 4px;
  align-self: flex-end;
  width: 450px;
  height: 40px;
  box-sizing: border-box;
  white-space: nowrap;
}

.user-info-section label,
.screen-selector label {
  font-weight: bold;
  color: var(--text-color, #333);
  min-width: 50px;
}

.user-info {
  font-weight: normal;
  color: var(--text-color, #333);
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.screen-selector select {
  padding: 5px 10px;
  border: 1px solid var(--border-color, #dee2e6);
  border-radius: 3px;
  background: var(--input-bg, #fff);
  color: var(--text-color, #333);
  flex: 1;
}

header {
  margin-bottom: 20px;
}

header nav {
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
  background-color: var(--bg-color, #f9f9f9);
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