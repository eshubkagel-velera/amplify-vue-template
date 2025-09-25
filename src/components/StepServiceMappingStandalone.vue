<template>
  <div class="component-container">

    
    <!-- Step Type Info -->
    <div v-if="stepTypeInfo" class="bordered-section">
      <h3>Step Type Information</h3>
      <p><strong>Step Type ID:</strong> {{ stepTypeInfo.STEP_TYPE_ID }}</p>
      <p><strong>Step Type Name:</strong> {{ stepTypeInfo.STEP_TYPE_NAME }}</p>
      <p><strong>Description:</strong> {{ stepTypeInfo.STEP_TYPE_DESC }}</p>
      <p><strong>Resource Name:</strong> {{ stepTypeInfo.RESOURCE_NAME }}</p>
    </div>
    <EntityManager
      :key="stepTypeId"
      entityName="STEP_SERVICE_MAPPING"
      :fields="['STEP_SERVICE_MAPPING_ID', 'SERVICE', 'SEQUENCE_NBR']"
      :formFields="[
        { name: 'STEP_TYPE_ID', type: 'number', required: true, disabled: true },
        { name: 'SERVICE_ID', type: 'select', required: true, disabled: false, options: [] },
        { name: 'SEQUENCE_NBR', type: 'number', required: false, disabled: false }
      ]"
      idField="STEP_SERVICE_MAPPING_ID"
      :loadFunction="loadStepServiceMappings"
      :createFunction="createStepServiceMapping"
      :updateFunction="updateStepServiceMapping"
      :deleteFunction="deleteStepServiceMapping"
      :hideFilters="true"
      :parentId="stepTypeId"
      :parentField="'STEP_TYPE_ID'"
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
import type { StepType } from '../types';
import { fetchAllPages } from '../utils/pagination';

const props = defineProps<{
  stepTypeId: number;
  readonly?: boolean;
}>();


const stepTypeInfo = ref<StepType | null>(null);

const loadStepServiceMappings = async (params = {}) => {
  const client = generateClient();
  const [mappings, services] = await Promise.all([
    fetchAllPages(client, queries.listStepServiceMappings, {}, 'listSTEP_SERVICE_MAPPINGS'),
    fetchAllPages(client, queries.listServices, {}, 'listSERVICES')
  ]);
  
  const filteredMappings = mappings.filter(
    (mapping: any) => mapping.STEP_TYPE_ID === props.stepTypeId
  );
  
  const enhancedMappings = filteredMappings.map(mapping => {
    const service = services.find(s => s.SERVICE_ID === mapping.SERVICE_ID);
    return {
      ...mapping,
      'SERVICE': service ? `${service.SERVICE_ID}: ${service.URI}` : mapping.SERVICE_ID
    };
  });
  
  return { data: { listSTEP_SERVICE_MAPPINGS: { items: enhancedMappings } } };
};

const loadStepTypeInfo = async () => {
  try {
    const client = generateClient();
    const stepTypes = await fetchAllPages(client, queries.listStepTypes, {}, 'listSTEP_TYPES');
    const stepType = stepTypes.find(st => st.STEP_TYPE_ID === props.stepTypeId);
    if (stepType) {
      stepTypeInfo.value = stepType;
    }
  } catch (error) {
    console.error('Error loading step type info:', error);
  }
};

const createStepServiceMapping = async (input: any) => {
  const mappingInput = { ...input, STEP_TYPE_ID: props.stepTypeId };
  return await generateClient().graphql({ query: mutations.createStepServiceMapping, variables: { input: mappingInput } });
};

const updateStepServiceMapping = async (input: any) => {
  return await generateClient().graphql({ query: mutations.updateStepServiceMapping, variables: { input } });
};

const deleteStepServiceMapping = async (input: any) => {
  return await generateClient().graphql({ query: mutations.deleteStepServiceMapping, variables: { input } });
};

// Load step type info on mount
loadStepTypeInfo();
</script>

<style scoped>
</style>
