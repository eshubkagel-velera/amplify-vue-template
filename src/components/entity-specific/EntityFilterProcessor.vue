<template>
  <div></div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { getClient } from '../../client.js';
import * as queries from '../../graphql/queries.js';

const props = defineProps({
  entityName: String,
  config: Object,
  allEntities: Array,
  selectedServiceFilter: String,
  selectedProductFilter: String,
  selectedStepFilter: String
});

const emit = defineEmits(['entitiesFiltered']);

const filterByService = async () => {
  if (props.entityName !== 'SERVICE_PARAM') return;
  
  if (props.selectedServiceFilter) {
    const filteredItems = props.allEntities.filter(item => 
      item.SERVICE_ID === parseInt(props.selectedServiceFilter)
    );
    emit('entitiesFiltered', filteredItems);
  } else {
    emit('entitiesFiltered', []);
  }
};

const filterByProduct = async () => {
  if (props.entityName !== 'REDIRECT_URL') return;
  
  if (props.selectedProductFilter) {
    const filteredItems = props.allEntities.filter(item => 
      item.ORIGIN_PRODUCT_ID === parseInt(props.selectedProductFilter)
    );
    emit('entitiesFiltered', filteredItems);
  } else {
    emit('entitiesFiltered', props.allEntities);
  }
};

const filterByStepType = async () => {
  if (props.entityName !== 'STEP_SERVICE_MAPPING') return;
  
  if (props.selectedStepFilter) {
    try {
      const [mappingsResult, stepTypesResult, servicesResult] = await Promise.all([
        getClient().graphql({
          query: queries.listStepServiceMappings,
          variables: {
            filter: { STEP_TYPE_ID: { eq: parseInt(props.selectedStepFilter) } },
            limit: 1000
          }
        }),
        getClient().graphql({ query: queries.listStepTypes }),
        getClient().graphql({ query: queries.listServices })
      ]);
      
      const mappings = mappingsResult.data.listSTEP_SERVICE_MAPPINGS?.items || [];
      const stepTypes = stepTypesResult.data.listSTEP_TYPES?.items || [];
      const services = servicesResult.data.listSERVICES?.items || [];
      
      const enhancedMappings = mappings.map(mapping => {
        const stepType = stepTypes.find(st => st.STEP_TYPE_ID === mapping.STEP_TYPE_ID);
        const service = services.find(s => s.SERVICE_ID === mapping.SERVICE_ID);
        return {
          ...mapping,
          'STEP_TYPE': stepType ? `${stepType.STEP_TYPE_ID}: ${stepType.STEP_TYPE_NAME}` : mapping.STEP_TYPE_ID,
          'SERVICE': service ? `${service.SERVICE_ID}: ${service.URI}` : mapping.SERVICE_ID
        };
      });
      
      emit('entitiesFiltered', enhancedMappings);
    } catch (error) {
      emit('entitiesFiltered', []);
    }
  } else {
    emit('entitiesFiltered', []);
  }
};

const processFilter = (filterType) => {
  switch (filterType) {
    case 'service':
      filterByService();
      break;
    case 'product':
      filterByProduct();
      break;
    case 'stepType':
      filterByStepType();
      break;
  }
};

watch(() => props.selectedServiceFilter, () => processFilter('service'));
watch(() => props.selectedProductFilter, () => processFilter('product'));
watch(() => props.selectedStepFilter, () => processFilter('stepType'));

defineExpose({
  filterByService,
  filterByProduct,
  filterByStepType,
  processFilter
});
</script>