<template>
  <div id="app">
    <AuthLogin v-if="!isAuthenticated" @authenticated="handleAuthenticated" />
    <div v-else>
      <div style="height: 250px;"></div>

    
    <main>
      <EntityManager
        v-if="showMappingManager"
        ref="mappingManagerRef"
        entityName="SERVICE_PARAM_MAPPING"
        :fields="getEntityConfig('SERVICE_PARAM_MAPPING').fields"
        :formFields="getEntityConfig('SERVICE_PARAM_MAPPING').formFields"
        :idField="getEntityConfig('SERVICE_PARAM_MAPPING').idField"
        :loadFunction="getEntityConfig('SERVICE_PARAM_MAPPING').loadFunction"
        :createFunction="getEntityConfig('SERVICE_PARAM_MAPPING').createFunction"
        :updateFunction="getEntityConfig('SERVICE_PARAM_MAPPING').updateFunction"
        :deleteFunction="getEntityConfig('SERVICE_PARAM_MAPPING').deleteFunction"
        :parentId="selectedProductId"
        parentField="ORIGIN_PRODUCT_ID"
        :readonly="isReadonly"
        :canDelete="canDelete"
        @entityCountChanged="handleEntityCountChanged"
        @selectedCountChanged="handleSelectedCountChanged"
      />
      <EntityManager
        v-else-if="showRedirectUrlManager"
        ref="redirectUrlRef"
        entityName="REDIRECT_URL"
        :fields="getEntityConfig('REDIRECT_URL').fields"
        :formFields="getEntityConfig('REDIRECT_URL').formFields"
        :idField="getEntityConfig('REDIRECT_URL').idField"
        :loadFunction="getEntityConfig('REDIRECT_URL').loadFunction"
        :createFunction="getEntityConfig('REDIRECT_URL').createFunction"
        :updateFunction="getEntityConfig('REDIRECT_URL').updateFunction"
        :deleteFunction="getEntityConfig('REDIRECT_URL').deleteFunction"
        :parentId="selectedProductId"
        parentField="ORIGIN_PRODUCT_ID"
        :readonly="isReadonly"
        :canDelete="canDelete"
        @entityCountChanged="handleEntityCountChanged"
        @selectedCountChanged="handleSelectedCountChanged"
      />
      <EntityManager
        v-else-if="showStepServicesManager"
        ref="stepServicesRef"
        entityName="STEP_SERVICE_MAPPING"
        :fields="getEntityConfig('STEP_SERVICE_MAPPING').fields"
        :formFields="getEntityConfig('STEP_SERVICE_MAPPING').formFields"
        :idField="getEntityConfig('STEP_SERVICE_MAPPING').idField"
        :loadFunction="getEntityConfig('STEP_SERVICE_MAPPING').loadFunction"
        :createFunction="getEntityConfig('STEP_SERVICE_MAPPING').createFunction"
        :updateFunction="getEntityConfig('STEP_SERVICE_MAPPING').updateFunction"
        :deleteFunction="getEntityConfig('STEP_SERVICE_MAPPING').deleteFunction"
        :parentId="selectedStepTypeId"
        parentField="STEP_TYPE_ID"
        :readonly="isReadonly"
        :canDelete="canDelete"
        @entityCountChanged="handleEntityCountChanged"
        @selectedCountChanged="handleSelectedCountChanged"
      />
      <EntityManager
        v-else-if="showServiceParamsManager"
        ref="serviceParamsRef"
        entityName="SERVICE_PARAM"
        :fields="getEntityConfig('SERVICE_PARAM').fields"
        :formFields="getEntityConfig('SERVICE_PARAM').formFields"
        :idField="getEntityConfig('SERVICE_PARAM').idField"
        :loadFunction="getEntityConfig('SERVICE_PARAM').loadFunction"
        :createFunction="getEntityConfig('SERVICE_PARAM').createFunction"
        :updateFunction="getEntityConfig('SERVICE_PARAM').updateFunction"
        :deleteFunction="getEntityConfig('SERVICE_PARAM').deleteFunction"
        :parentId="selectedServiceId"
        parentField="SERVICE_ID"
        :readonly="isReadonly"
        :canDelete="canDelete"
        @entityCountChanged="handleEntityCountChanged"
        @selectedCountChanged="handleSelectedCountChanged"
      />
      <EntityManager
        v-else-if="showServiceStepMappingManager"
        ref="serviceStepMappingRef"
        entityName="STEP_SERVICE_MAPPING"
        :fields="getEntityConfig('STEP_SERVICE_MAPPING').fields"
        :formFields="getEntityConfig('STEP_SERVICE_MAPPING').formFields"
        :idField="getEntityConfig('STEP_SERVICE_MAPPING').idField"
        :loadFunction="getEntityConfig('STEP_SERVICE_MAPPING').loadFunction"
        :createFunction="getEntityConfig('STEP_SERVICE_MAPPING').createFunction"
        :updateFunction="getEntityConfig('STEP_SERVICE_MAPPING').updateFunction"
        :deleteFunction="getEntityConfig('STEP_SERVICE_MAPPING').deleteFunction"
        :parentId="selectedServiceId"
        parentField="SERVICE_ID"
        :readonly="isReadonly"
        :canDelete="canDelete"
        @entityCountChanged="handleEntityCountChanged"
        @selectedCountChanged="handleSelectedCountChanged"
      />
      <EntityManager
        v-else-if="currentView === 'REDIRECT_URL'"
        ref="redirectUrlMainRef"
        entityName="REDIRECT_URL"
        :fields="getEntityConfig('REDIRECT_URL').fields"
        :formFields="getEntityConfig('REDIRECT_URL').formFields"
        :idField="getEntityConfig('REDIRECT_URL').idField"
        :loadFunction="getEntityConfig('REDIRECT_URL').loadFunction"
        :createFunction="getEntityConfig('REDIRECT_URL').createFunction"
        :updateFunction="getEntityConfig('REDIRECT_URL').updateFunction"
        :deleteFunction="getEntityConfig('REDIRECT_URL').deleteFunction"
        :readonly="isReadonly"
        :canDelete="canDelete"
      />
      <EntityManager
        v-else-if="currentView === 'SERVICE_PARAM_MAPPING'"
        ref="mappingMainRef"
        entityName="SERVICE_PARAM_MAPPING"
        :fields="getEntityConfig('SERVICE_PARAM_MAPPING').fields"
        :formFields="getEntityConfig('SERVICE_PARAM_MAPPING').formFields"
        :idField="getEntityConfig('SERVICE_PARAM_MAPPING').idField"
        :loadFunction="getEntityConfig('SERVICE_PARAM_MAPPING').loadFunction"
        :createFunction="getEntityConfig('SERVICE_PARAM_MAPPING').createFunction"
        :updateFunction="getEntityConfig('SERVICE_PARAM_MAPPING').updateFunction"
        :deleteFunction="getEntityConfig('SERVICE_PARAM_MAPPING').deleteFunction"
        :readonly="isReadonly"
        :canDelete="canDelete"
      />
      <ServiceImport v-else-if="currentView === 'import'" :readonly="isReadonly" />
      <HomeScreen v-else-if="currentView === 'home'" />
      <EnvironmentComparison 
        v-else-if="currentView === 'compare'"
        :primaryEnvironment="currentEnvironment"
        :selectedEntity="previousView || 'SERVICE'"
        :entityConfig="getReactiveEntityConfig(previousView || 'SERVICE')"
        :compareEnvironment="compareEnvironment"

      />
      <EntityManager
        v-else-if="currentView && currentEntityConfig && currentView !== 'REDIRECT_URL' && currentView !== 'SERVICE_PARAM_MAPPING'"
        ref="entityManagerRef"
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
        @entityCountChanged="handleEntityCountChanged"
        @selectedCountChanged="handleSelectedCountChanged"
        :readonly="isReadonly"
        :canDelete="canDelete"
      />
      </main>
      <div style="position: fixed; top: 0; left: 0; right: 0; display: flex; flex-direction: column; background: var(--bg-color, #fff); z-index: 1000; padding: 10px; border-bottom: 1px solid var(--border-color, #dee2e6); height: 250px;">
        <div style="display: flex; align-items: center; margin-bottom: 10px;">
          <div style="text-align: center; flex: 1; margin-right: 20px;">
            <h1 style="margin: 0; font-size: 2rem;">Hazel Mapping Editor</h1>
            <h2 style="margin: 5px 0 0 0; font-size: 1.2rem; color: var(--text-color, #666);">{{ currentView === 'import' ? 'Import Services' : currentView === 'home' ? 'Home' : currentView === 'compare' ? `Environment Comparison (${previousView || 'Unknown'})` : currentView + ' Manager' }}</h2>
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
              <EnvironmentSelector :disabled="currentView === 'compare'" />
              <div class="screen-selector">
                <label for="screen-select">Screen:</label>
                <select id="screen-select" :value="currentView === 'compare' ? previousView : currentView" @change="changeView" :disabled="showMappingManager || showRedirectUrlManager || showStepServicesManager || showServiceParamsManager || showServiceStepMappingManager || currentView === 'compare'">
                  <option value="home">Home</option>
                  <option v-for="entity in sortedEntities" :key="entity.name" :value="entity.name">
                    {{ entity.name }}
                  </option>
                  <option v-if="canAccessImport" value="import">Import Services</option>
                </select>
              </div>
              <div style="display: flex; align-items: center; gap: 10px;">
                <button v-if="currentView === 'compare'" @click="closeComparisonView" class="btn-primary">
                  Back to {{ previousView }}
                </button>
                <button v-if="showMappingManager" @click="closeMappingManager" class="btn-primary">
                  Back to {{ currentView }}
                </button>
                <button v-if="showRedirectUrlManager" @click="closeRedirectUrlManager" class="btn-primary">
                  Back to ORIGIN_PRODUCT
                </button>
                <button v-if="showStepServicesManager" @click="closeStepServicesManager" class="btn-primary">
                  Back to STEP_TYPE
                </button>
                <button v-if="showServiceParamsManager" @click="closeServiceParamsManager" class="btn-primary">
                  Back to SERVICE
                </button>
                <button v-if="showServiceStepMappingManager" @click="closeServiceStepMappingManager" class="btn-primary">
                  Back to SERVICE
                </button>
                <div class="screen-selector">
                  <label for="compare-select">Compare Environment:</label>
                  <select id="compare-select" v-model="compareEnvironment" @change="handleCompareChange" :disabled="!canCompare && currentView !== 'compare'">
                    <option value="">None</option>
                    <option v-for="env in getAvailableEnvironments()" :key="env" :value="env">
                      {{ env.toUpperCase() }} - {{ getDataSourceName(env) }}{{ getReadonlyStatus(env) }}
                    </option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <template v-if="showServiceParamsManager">
              <button @click="refreshEntities" class="btn-primary">Refresh</button>
              <button @click="showCreateModal" class="btn-success" :disabled="isReadonly">{{ isReadonly ? 'View Only Mode' : 'Add New' }}</button>
              <button @click="deleteSelected" :disabled="selectedCount === 0 || !canDelete" class="btn-danger">Delete Selected ({{ selectedCount }})</button>
              <span class="record-count">{{ entityCount }} records</span>
            </template>
          </div>
          <div style="display: flex; align-items: center; gap: 10px; justify-content: flex-end;">
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
  
  // Initialize entities after authentication
  initializeEntities();
  
  loadUserInfo();
  startInactivityTimer();
  
  // Always go to home screen on fresh login
  currentView.value = 'home';
  localStorage.setItem('currentView', 'home');
};

const signOut = async () => {
  try {
    clearTimeout(inactivityTimer);
    await cognitoSignOut();
    isAuthenticated.value = false;
    user.value = null;
    userGroups.value = [];
  } catch (err) {
    // Handle sign out error silently
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
        
        // Update the global auth state
        const { useAuth } = await import('./composables/useAuth');
        const { setUserGroups } = useAuth();
        setUserGroups(userGroups.value);
      }
    }
  } catch (err) {
    // Handle user info loading error silently
  }
};
import EntityManager from './components/EntityManager.vue';
import ServiceImport from './components/ServiceImport.vue';

import ThemeToggle from './components/ThemeToggle.vue';
import HomeScreen from './components/HomeScreen.vue';
import EnvironmentComparison from './components/EnvironmentComparison.vue';


import { getClient, getUserPoolClient } from './client.js';
import * as queries from './graphql/queries';
import * as mutations from './graphql/mutations';
import { fetchAllPages } from './utils/pagination.js';

// Use auth composable for permission checking
const { isAdmin, isDeployment, isDeveloper, isReadonly, canEdit, canDelete, userGroups: filteredUserGroups } = useAuth();

const getDataSourceName = (env) => {
  const envVarName = `VITE_DB_NAME_${env.toUpperCase()}`;
  return import.meta.env[envVarName] || env;
};

const getReadonlyStatus = (env) => {
  // Explicit readonly role gets readonly on all environments
  if (isReadonly.value && !isDeveloper.value) return ' (readonly)';
  
  // Developer in UAT/LIVE is readonly
  if (isDeveloper.value && (env === 'uat' || env === 'live')) return ' (readonly)';
  
  return '';
};

const currentEnvironment = ref(localStorage.getItem('selectedEnvironment') || 'dev');
const compareEnvironment = ref(localStorage.getItem('compareEnvironment') || '');

// Watch for environment changes
watch(() => localStorage.getItem('selectedEnvironment'), (newEnv) => {
  currentEnvironment.value = newEnv || 'dev';
}, { immediate: true });

// Watch for compare environment changes
watch(() => localStorage.getItem('compareEnvironment'), (newEnv) => {
  compareEnvironment.value = newEnv || '';
}, { immediate: true });

// Listen for environment change events
const handleEnvironmentChange = (event) => {
  currentEnvironment.value = event.detail.environment;
  
  // Check if user has access to current screen in new environment
  if (currentView.value === 'import' && !canAccessImport.value) {
    currentView.value = 'home';
  }
};

window.addEventListener('environmentChanged', handleEnvironmentChange);

const canAccessImport = computed(() => {
  const env = currentEnvironment.value;
  
  // Admin and deployment can access import in all environments
  if (isAdmin.value || isDeployment.value) return true;
  
  // Developer can access import only in dev and test
  if (isDeveloper.value && (env === 'dev' || env === 'test')) return true;
  
  // Readonly cannot access import
  return false;
});

const canCompare = computed(() => {
  return currentView.value !== 'home' && currentView.value !== 'import' && currentView.value !== 'compare';
});

// Initialize client lazily to ensure Amplify is configured first
let client: any = null;
const getClientInstance = () => {
  if (!client) {
    client = getClient();
  }
  return client;
};



const currentView = ref('home');
const previousView = ref('');
const showMappingManager = ref(false);
const showRedirectUrlManager = ref(false);
const showStepServicesManager = ref(false);
const showServiceParamsManager = ref(false);
const showServiceStepMappingManager = ref(false);
const selectedProductId = ref(null);
const selectedStepTypeId = ref(null);
const selectedServiceId = ref(null);
const entityManagerRef = ref(null);
const serviceParamsRef = ref(null);
const redirectUrlRef = ref(null);
const mappingManagerRef = ref(null);
const stepServicesRef = ref(null);
const serviceStepMappingRef = ref(null);

const getEntityConfig = (entityName) => {
  return entities.value.find(entity => entity.name === entityName);
};

const initializeEntities = () => {
  try {
    entities.value = getEntityConfigs(getClientInstance());
    console.log('Entities initialized:', entities.value.length, entities.value.map(e => e.name));
  } catch (error) {
    console.error('Failed to initialize entities:', error);
    entities.value = [];
  }
};

const entityCount = ref(0);
const selectedCount = ref(0);

import { getEntityConfigs } from './config/entityConfig.js';

const entities = ref([]);

const sortedEntities = computed(() => {
  return [...entities.value].sort((a, b) => a.name.localeCompare(b.name));
});



const changeView = (event) => {
  if (currentView.value !== 'compare') {
    currentView.value = event.target.value;
    localStorage.setItem('currentView', currentView.value);
  }
  window.scrollTo(0, 0);
};

// Watch currentView to track entity screens
watch(currentView, (newView, oldView) => {
  if (oldView && oldView !== 'home' && oldView !== 'import' && oldView !== 'compare') {
    previousView.value = oldView;
  }
});

const getAvailableEnvironments = () => {
  const allEnvs = ['dev', 'test', 'uat', 'live'];
  return allEnvs.filter(env => env !== currentEnvironment.value);
};

const handleCompareChange = () => {
  // Update localStorage and window global
  localStorage.setItem('compareEnvironment', compareEnvironment.value);
  window.compareEnvironment = compareEnvironment.value;
  
  if (compareEnvironment.value && currentView.value !== 'home' && currentView.value !== 'import' && currentView.value !== 'compare') {
    previousView.value = currentView.value;
    localStorage.setItem('previousView', previousView.value);
    currentView.value = 'compare';
  }
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

const closeComparisonView = () => {
  compareEnvironment.value = '';
  localStorage.setItem('compareEnvironment', '');
  window.compareEnvironment = '';
  currentView.value = previousView.value || 'home';
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

const handleEntityCountChanged = (count) => {
  entityCount.value = count;
};

const handleSelectedCountChanged = (count) => {
  selectedCount.value = count;
};

const refreshEntities = () => {
  if (entityManagerRef.value) {
    entityManagerRef.value.loadEntities();
  } else if (serviceParamsRef.value) {
    serviceParamsRef.value.loadEntities();
  } else if (redirectUrlRef.value) {
    redirectUrlRef.value.loadEntities();
  } else if (mappingManagerRef.value) {
    mappingManagerRef.value.loadEntities();
  } else if (stepServicesRef.value) {
    stepServicesRef.value.loadEntities();
  } else if (serviceStepMappingRef.value) {
    serviceStepMappingRef.value.loadEntities();
  }
};

const showCreateModal = () => {
  if (isReadonly.value) return;
  
  if (entityManagerRef.value) {
    entityManagerRef.value.showCreateModal = true;
  } else if (serviceParamsRef.value) {
    serviceParamsRef.value.showCreateModal = true;
  } else if (redirectUrlRef.value) {
    redirectUrlRef.value.showCreateModal = true;
  } else if (mappingManagerRef.value) {
    mappingManagerRef.value.showCreateModal = true;
  } else if (stepServicesRef.value) {
    stepServicesRef.value.showCreateModal = true;
  } else if (serviceStepMappingRef.value) {
    serviceStepMappingRef.value.showCreateModal = true;
  }
};

const deleteSelected = () => {
  if (selectedCount.value === 0 || !canDelete.value) return;
  
  if (entityManagerRef.value) {
    entityManagerRef.value.confirmBulkDelete();
  } else if (serviceParamsRef.value) {
    serviceParamsRef.value.confirmBulkDelete();
  } else if (redirectUrlRef.value) {
    redirectUrlRef.value.confirmBulkDelete();
  } else if (mappingManagerRef.value) {
    mappingManagerRef.value.confirmBulkDelete();
  } else if (stepServicesRef.value) {
    stepServicesRef.value.confirmBulkDelete();
  } else if (serviceStepMappingRef.value) {
    serviceStepMappingRef.value.confirmBulkDelete();
  }
};

// Watch for environment changes and trigger refresh
const environmentChangeKey = ref(0);
watch(() => localStorage.getItem('selectedEnvironment'), () => {
  environmentChangeKey.value++;
}, { immediate: false });

// Add environment reactivity to entity configs
const getReactiveEntityConfig = (entityName) => {
  const baseConfig = entities.value.find(entity => entity.name === entityName);
  if (!baseConfig) return null;
  
  // Force reactivity by including environmentChangeKey
  environmentChangeKey.value; // This makes the computed reactive to environment changes
  return baseConfig;
};

const currentEntityConfig = computed(() => {
  return getReactiveEntityConfig(currentView.value);
});

onMounted(async () => {
  await checkAuthState();
  
  if (isAuthenticated.value) {
    // User is already logged in (page refresh) - preserve current state
    await loadUserInfo();
    
    const savedCompareEnv = localStorage.getItem('compareEnvironment');
    if (savedCompareEnv) {
      compareEnvironment.value = savedCompareEnv;
      const savedPreviousView = localStorage.getItem('previousView');
      if (savedPreviousView) {
        previousView.value = savedPreviousView;
        currentView.value = 'compare';
      }
    } else {
      const savedView = localStorage.getItem('currentView');
      currentView.value = savedView || 'home';
    }
  } else {
    // User not logged in - will show login screen
    currentView.value = 'home';
    compareEnvironment.value = '';
    localStorage.setItem('currentView', 'home');
    localStorage.setItem('compareEnvironment', '');
  }
  
  // Initialize entities regardless of auth state for dropdown
  initializeEntities();
  
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
  padding: 0;
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

.btn-success:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.btn-danger {
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 12px;
  cursor: pointer;
  margin-right: 10px;
}

.btn-danger:hover:not(:disabled) {
  background: #c82333;
}

.btn-danger:disabled {
  background: #6c757d;
  cursor: not-allowed;
}
</style>