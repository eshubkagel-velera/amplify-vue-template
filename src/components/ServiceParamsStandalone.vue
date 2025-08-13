<template>
  <div class="component-container">
    <h2>Service Parameters for Service ID: {{ serviceId }}</h2>
    
    <!-- Service Info -->
    <div v-if="serviceInfo" class="bordered-section">
      <h3>Service Information</h3>
      <p><strong>Service ID:</strong> {{ serviceInfo.SERVICE_ID }}</p>
      <p><strong>URI:</strong> {{ serviceInfo.URI }}</p>
      <p><strong>Service Provider:</strong> {{ serviceInfo.SERVICE_PROVIDER_NAME }}</p>
    </div>
    <EntityManager
      entityName="SERVICE_PARAM"
      :fields="['SERVICE_PARAM_ID', 'PARAM_NAME', 'CREATED_DATE']"
      :formFields="[
        { name: 'SERVICE_ID', type: 'number', required: true, disabled: true },
        { name: 'PARAM_NAME', type: 'text', required: true, disabled: false },
        { name: 'CREATED_BY_USER_ID', type: 'number', required: true, disabled: false },
        { name: 'CREATED_DATE', type: 'date', required: true, disabled: false }
      ]"
      idField="SERVICE_PARAM_ID"
      :loadFunction="loadServiceParams"
      :createFunction="createServiceParam"
      :updateFunction="updateServiceParam"
      :deleteFunction="deleteServiceParam"
      :hideFilters="true"
      :parentId="serviceId"
      :parentField="'SERVICE_ID'"
    />
  </div>
</template>

<script setup lang="ts">
import '../styles/shared.css';
import { defineProps, ref } from 'vue';
import EntityManager from './EntityManager.vue';
import { generateClient } from 'aws-amplify/api';
import * as queries from '../graphql/queries';
import * as mutations from '../graphql/mutations';
import type { Service, ServiceParam } from '../types';

const props = defineProps<{
  serviceId: number;
}>();


const serviceInfo = ref<Service & { SERVICE_PROVIDER_NAME: string } | null>(null);

const loadServiceParams = async () => {
  const result = await generateClient().graphql({ query: queries.listServiceParams });
  const filteredParams = result.data.listSERVICE_PARAMS.items.filter(
    (param: any) => param.SERVICE_ID === props.serviceId
  );
  return { data: { listSERVICE_PARAMS: { items: filteredParams } } };
};

const loadServiceInfo = async () => {
  try {
    const [servicesResult, providersResult] = await Promise.all([
      generateClient().graphql({ query: queries.listServices }),
      generateClient().graphql({ query: queries.listServiceProviders })
    ]);
    
    const service = servicesResult.data.listSERVICES.items.find(s => s.SERVICE_ID === props.serviceId);
    if (service) {
      const provider = providersResult.data.listSERVICE_PROVIDERS.items.find(p => p.SERVICE_PROVIDER_ID === service.SERVICE_PROVIDER_ID);
      serviceInfo.value = {
        ...service,
        SERVICE_PROVIDER_NAME: provider ? provider.SERVICE_PROVIDER_NAME : 'Unknown'
      };
    }
  } catch (error) {
    console.error('Error loading service info:', error);
  }
};

const createServiceParam = async (input: any) => {
  const paramInput = { ...input, SERVICE_ID: props.serviceId };
  return await generateClient().graphql({ query: mutations.createServiceParam, variables: { input: paramInput } });
};

const updateServiceParam = async (input: any) => {
  return await generateClient().graphql({ query: mutations.updateServiceParam, variables: { input } });
};

const deleteServiceParam = async (input: any) => {
  const mappingsResult = await generateClient().graphql({ query: queries.listServiceParamMappings });
  const hasMappings = mappingsResult.data.listSERVICE_PARAM_MAPPINGS.items.some(
    (mapping: any) => mapping.SOURCE_SERVICE_PARAM_ID === input.SERVICE_PARAM_ID || 
                     mapping.TARGET_SERVICE_PARAM_ID === input.SERVICE_PARAM_ID
  );
  
  if (hasMappings) {
    throw new Error('Cannot delete parameter: it has associated mappings');
  }
  
  return await generateClient().graphql({ query: mutations.deleteServiceParam, variables: { input } });
};

// Load service info on mount
loadServiceInfo();
</script>

<style scoped>
</style>
