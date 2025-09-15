<template>
  <div class="component-container">
    <h2>Step Mappings for Service ID: {{ serviceId }}</h2>
    
    <!-- Service Info -->
    <div v-if="serviceInfo" class="bordered-section">
      <h3>Service Information</h3>
      <p><strong>Service ID:</strong> {{ serviceInfo.SERVICE_ID }}</p>
      <p><strong>URI:</strong> {{ serviceInfo.URI }}</p>
      <p><strong>Service Provider:</strong> {{ serviceInfo.SERVICE_PROVIDER_NAME }}</p>
    </div>
    <EntityManager
      entityName="STEP_SERVICE_MAPPING"
      :fields="['STEP_SERVICE_MAPPING_ID', 'STEP_TYPE', 'SEQUENCE_NBR']"
      :formFields="[
        { name: 'SERVICE_ID', type: 'number', required: true, disabled: true },
        { name: 'STEP_TYPE_ID', type: 'select', required: true, disabled: false, options: [] },
        { name: 'SEQUENCE_NBR', type: 'number', required: false, disabled: false }
      ]"
      idField="STEP_SERVICE_MAPPING_ID"
      :loadFunction="loadServiceStepMappings"
      :createFunction="createStepServiceMapping"
      :updateFunction="updateStepServiceMapping"
      :deleteFunction="deleteStepServiceMapping"
      :hideFilters="true"
      :parentId="serviceId"
      :parentField="'SERVICE_ID'"
      :readonly="props.readonly || false"
      :canDelete="!props.readonly"
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
import type { Service } from '../types';

const props = defineProps<{
  serviceId: number;
  readonly?: boolean;
}>();


const serviceInfo = ref<(Service & { SERVICE_PROVIDER_NAME: string }) | null>(null);

const loadServiceStepMappings = async () => {
  const [mappingsResult, stepTypesResult] = await Promise.all([
    generateClient().graphql({ query: queries.listStepServiceMappings }),
    generateClient().graphql({ query: queries.listStepTypes })
  ]);
  
  const mappings = mappingsResult.data.listSTEP_SERVICE_MAPPINGS.items.filter(
    (mapping: any) => mapping.SERVICE_ID === props.serviceId
  );
  const stepTypes = stepTypesResult.data.listSTEP_TYPES.items;
  
  const enhancedMappings = mappings.map(mapping => {
    const stepType = stepTypes.find(st => st.STEP_TYPE_ID === mapping.STEP_TYPE_ID);
    return {
      ...mapping,
      'STEP_TYPE': stepType ? `${stepType.STEP_TYPE_ID}: ${stepType.STEP_TYPE_NAME}` : mapping.STEP_TYPE_ID
    };
  });
  
  return { data: { listSTEP_SERVICE_MAPPINGS: { items: enhancedMappings } } };
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

const createStepServiceMapping = async (input: any) => {
  const mappingInput = { ...input, SERVICE_ID: props.serviceId };
  return await generateClient().graphql({ query: mutations.createStepServiceMapping, variables: { input: mappingInput } });
};

const updateStepServiceMapping = async (input: any) => {
  return await generateClient().graphql({ query: mutations.updateStepServiceMapping, variables: { input } });
};

const deleteStepServiceMapping = async (input: any) => {
  return await generateClient().graphql({ query: mutations.deleteStepServiceMapping, variables: { input } });
};

// Load service info on mount
loadServiceInfo();
</script>

<style scoped>
</style>
