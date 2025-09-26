<template>
  <div class="environment-selector">
    <label for="env-select">Environment:</label>
    <select id="env-select" v-model="selectedEnvironment" @change="switchEnvironment">
      <option v-for="(config, key) in environments" :key="key" :value="key">
        {{ key.toUpperCase() }} - {{ getDataSourceName(key) }}
      </option>
    </select>
    <span class="env-indicator" :class="`env-${selectedEnvironment}`">{{ selectedEnvironment.toUpperCase() }}</span>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useAuth } from '../composables/useAuth';

const selectedEnvironment = ref('dev');
const allEnvironments = ref({});
const { isAdmin, isDeployment, isDeveloper } = useAuth();

const environments = computed(() => {
  const filtered = {};
  
  // Admin and deployment can see all environments
  if (isAdmin.value || isDeployment.value) {
    return allEnvironments.value;
  }
  
  // Developer can see all environments (but readonly in UAT/LIVE)
  if (isDeveloper.value) {
    return allEnvironments.value;
  }
  
  // Readonly can only see dev and test
  Object.keys(allEnvironments.value).forEach(key => {
    if (key === 'dev' || key === 'test') {
      filtered[key] = allEnvironments.value[key];
    }
  });
  
  return filtered;
});

onMounted(() => {
  allEnvironments.value = window.environments || {};
  selectedEnvironment.value = window.currentEnvironment || 'dev';
});

const getDataSourceName = (env) => {
  const envVarName = `VITE_DB_NAME_${env.toUpperCase()}`;
  return import.meta.env[envVarName] || env;
};

const switchEnvironment = () => {
  if (window.switchEnvironment) {
    window.switchEnvironment(selectedEnvironment.value);
    // Trigger data refresh across all components
    window.dispatchEvent(new CustomEvent('environmentChanged', { 
      detail: { environment: selectedEnvironment.value } 
    }));
  }
};
</script>

<style scoped>
.environment-selector {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: var(--bg-color);
  border: 1px solid var(--border-color);
  border-radius: 4px;
}

label {
  font-weight: bold;
  color: var(--text-color);
}

select {
  padding: 5px 10px;
  border: 1px solid var(--border-color);
  border-radius: 3px;
  background: var(--input-bg);
  color: var(--text-color);
  min-width: 200px;
}

.env-indicator {
  padding: 4px 8px;
  border-radius: 3px;
  font-size: 12px;
  font-weight: bold;
}

.env-dev { background: #28a745; color: white; }
.env-test { background: #ffc107; color: black; }
.env-uat { background: #fd7e14; color: white; }
.env-live { background: #dc3545; color: white; }
</style>