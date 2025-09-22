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
import { ref, onMounted } from 'vue';

const selectedEnvironment = ref('dev');
const environments = ref({});

onMounted(() => {
  environments.value = window.environments || {};
  selectedEnvironment.value = window.currentEnvironment || 'dev';
});

const getDataSourceName = (env) => {
  const dataSourceMap = {
    dev: 'hazel_mapping_dev',
    test: 'hazel_mapping_test', 
    uat: 'hazel_mapping_uat',
    prod: 'hazel_mapping_live'
  };
  return dataSourceMap[env] || env;
};

const switchEnvironment = () => {
  if (window.switchEnvironment) {
    window.switchEnvironment(selectedEnvironment.value);
    // No reload needed - same auth session across environments
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
.env-prod { background: #dc3545; color: white; }
</style>