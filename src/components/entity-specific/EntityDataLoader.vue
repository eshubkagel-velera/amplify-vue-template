<template>
  <div></div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { getClient } from '../../client.js';
import * as queries from '../../graphql/queries.js';

const props = defineProps({
  entityName: String,
  config: Object,
  formFields: Array,
  loadFunction: Function,
  selectedServiceFilter: String,
  selectedProductFilter: String,
  selectedStepFilter: String
});

const emit = defineEmits(['optionsLoaded', 'vendorNamesLoaded']);

const serviceOptions = ref([]);
const productOptions = ref([]);
const vendorNames = ref([]);

const loadEntitySpecificData = async () => {
  const config = props.config;
  
  // Load foreign key options
  if (config.foreignKeys) {
    await loadForeignKeyOptions();
  }
  
  if (config.loadServiceOptions || props.entityName === 'SERVICE_PARAM') {
    await loadServiceOptions();
  }
  
  if (config.loadServiceProviders) {
    await loadServiceProviderOptions();
  }
  
  if (config.loadStepServiceMapping) {
    await loadStepServiceMappingOptions();
  }
  
  if (config.loadVendorNames) {
    await loadVendorNames();
  }
  
  if (config.loadProductOptions) {
    await loadProductOptions();
  }
};

const loadForeignKeyOptions = async () => {
  const config = props.config;
  
  for (const [fieldName, fkConfig] of Object.entries(config.foreignKeys)) {
    try {
      const queryName = `list${fkConfig.table.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join('')}s`;
      const listName = `list${fkConfig.table}S`;
      
      if (queries[queryName]) {
        const result = await getClient().graphql({ query: queries[queryName] });
        const items = result.data[listName]?.items || [];
        
        const options = items.map(item => ({
          value: item[fkConfig.valueField],
          label: `${item[fkConfig.valueField]}: ${item[fkConfig.displayField]}`
        }));
        
        const formField = props.formFields.find(f => f.name === fieldName);
        if (formField) {
          formField.options = options;
        }
      }
    } catch (error) {
      console.error(`Failed to load options for ${fieldName}:`, error);
    }
  }
};

const loadServiceOptions = async () => {
  try {
    const { useServiceEnhancement } = await import('../../composables/useServiceEnhancement.js');
    const { loadServiceOptions } = useServiceEnhancement();
    const options = await loadServiceOptions();
    serviceOptions.value = options;
    
    // Update form field options
    const serviceIdField = props.formFields.find(f => f.name === 'SERVICE_ID');
    if (serviceIdField) {
      serviceIdField.options = options;
    }
    
    emit('optionsLoaded', { type: 'service', options });
  } catch (error) {
    // Fallback: load services directly
    try {
      const { getClient } = await import('../../client.js');
      const result = await getClient().graphql({ query: queries.listServices });
      const services = result.data.listSERVICES?.items || [];
      
      const options = services.map(service => ({
        value: service.SERVICE_ID,
        label: `${service.SERVICE_ID}: ${service.URI}`
      }));
      
      serviceOptions.value = options;
      
      const serviceIdField = props.formFields.find(f => f.name === 'SERVICE_ID');
      if (serviceIdField) {
        serviceIdField.options = options;
      }
      
      emit('optionsLoaded', { type: 'service', options });
    } catch (fallbackError) {
      console.error('Failed to load service options:', fallbackError);
    }
  }
};

const loadServiceProviderOptions = async () => {
  try {
    const result = await getClient().graphql({ query: queries.listServiceProviders });
    const providers = result.data.listSERVICE_PROVIDERS?.items || [];
    
    const providerIdField = props.formFields.find(f => f.name === 'SERVICE_PROVIDER_ID');
    if (providerIdField) {
      providerIdField.options = providers.map(provider => ({
        value: provider.SERVICE_PROVIDER_ID,
        label: `${provider.SERVICE_PROVIDER_ID}: ${provider.SERVICE_PROVIDER_NAME}`
      }));
    }
  } catch (error) {
    console.error('Failed to load service provider options:', error);
  }
};

const loadStepServiceMappingOptions = async () => {
  try {
    const [stepTypesResult, servicesResult] = await Promise.all([
      getClient().graphql({ query: queries.listStepTypes }),
      getClient().graphql({ query: queries.listServices })
    ]);
    
    const stepTypes = stepTypesResult.data.listSTEP_TYPES?.items || [];
    const services = servicesResult.data.listSERVICES?.items || [];
    
    const stepTypeField = props.formFields.find(f => f.name === 'STEP_TYPE_ID');
    if (stepTypeField) {
      stepTypeField.options = stepTypes.map(step => ({
        value: step.STEP_TYPE_ID,
        label: `${step.STEP_TYPE_ID}: ${step.STEP_TYPE_NAME}`
      }));
    }
    
    const serviceField = props.formFields.find(f => f.name === 'SERVICE_ID');
    if (serviceField) {
      serviceField.options = services.map(service => ({
        value: service.SERVICE_ID,
        label: `${service.SERVICE_ID}: ${service.URI}`
      }));
    }
  } catch (error) {
    console.error('Failed to load step service mapping options:', error);
  }
};

const loadVendorNames = async () => {
  if (!props.loadFunction) return;
  
  try {
    const response = await props.loadFunction({ limit: 1000 });
    const listName = `list${props.entityName}S`;
    
    if (response.data && response.data[listName]) {
      const items = response.data[listName].items || [];
      const uniqueVendors = [...new Set(
        items.map(item => item.VENDOR_NAME).filter(name => name && name.trim())
      )].sort();
      
      vendorNames.value = uniqueVendors;
      emit('vendorNamesLoaded', uniqueVendors);
    }
  } catch (error) {
    console.error('Failed to load vendor names:', error);
  }
};

const loadProductOptions = async () => {
  try {
    const { callExternalApi } = await import('../../client.js');
    const environment = localStorage.getItem('selectedEnvironment') || 'dev';
    const result = await callExternalApi(environment, 'listORIGIN_PRODUCTS');
    const products = result.data.listORIGIN_PRODUCTS.items || [];
    
    productOptions.value = products.map(product => ({
      value: product.ORIGIN_PRODUCT_ID,
      label: `${product.ORIGIN_PRODUCT_ID}: ${product.PRODUCT_ID}`
    }));
    
    const productIdField = props.formFields.find(f => f.name === 'ORIGIN_PRODUCT_ID');
    if (productIdField) {
      productIdField.options = productOptions.value;
    }
    
    emit('optionsLoaded', { type: 'product', options: productOptions.value });
  } catch (error) {
    console.error('Failed to load product options:', error);
  }
};

watch(() => props.entityName, loadEntitySpecificData);
onMounted(loadEntitySpecificData);

defineExpose({
  loadEntitySpecificData,
  serviceOptions,
  productOptions,
  vendorNames
});
</script>