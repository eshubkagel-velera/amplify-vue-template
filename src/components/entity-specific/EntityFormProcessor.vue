<template>
  <div></div>
</template>

<script setup>
import { ref } from 'vue';
import { getCurrentDateString } from '../../utils/dateUtils.js';

const props = defineProps({
  entityName: String,
  config: Object,
  formData: Object,
  formFields: Array,
  userProfileId: Number,
  paramMappings: Map
});

const emit = defineEmits(['formProcessed']);

const processFormData = (isUpdate = false) => {
  let cleanedFormData = { ...props.formData };
  
  // Convert number fields
  props.formFields.forEach(field => {
    if (field.type === 'number' && cleanedFormData[field.name] !== undefined && cleanedFormData[field.name] !== '') {
      const converted = parseInt(cleanedFormData[field.name]);
      if (!isNaN(converted)) {
        cleanedFormData[field.name] = converted;
      }
    }
  });
  
  // Entity-specific processing
  if (props.entityName === 'STEP_SERVICE_MAPPING') {
    cleanedFormData = processStepServiceMapping(cleanedFormData, isUpdate);
  } else if (props.entityName === 'SERVICE_PARAM' && isUpdate) {
    const result = processServiceParam(cleanedFormData, isUpdate);
    if (result.shouldCreateCopy) {
      emit('formProcessed', result);
      return result;
    }
    cleanedFormData = result;
  } else {
    cleanedFormData = processGenericEntity(cleanedFormData, isUpdate);
  }
  
  emit('formProcessed', { cleanedFormData, shouldCreateCopy: false });
  return { cleanedFormData, shouldCreateCopy: false };
};

const processStepServiceMapping = (data, isUpdate) => {
  const cleaned = {};
  if (data.STEP_TYPE_ID) cleaned.STEP_TYPE_ID = parseInt(data.STEP_TYPE_ID);
  if (data.SERVICE_ID) cleaned.SERVICE_ID = parseInt(data.SERVICE_ID);
  if (data.SEQUENCE_NBR) cleaned.SEQUENCE_NBR = parseInt(data.SEQUENCE_NBR);
  if (isUpdate && data.STEP_SERVICE_MAPPING_ID) {
    cleaned.STEP_SERVICE_MAPPING_ID = parseInt(data.STEP_SERVICE_MAPPING_ID);
  }
  return cleaned;
};

const processServiceParam = (data, isUpdate) => {
  let cleaned = { ...data };
  
  // Check if param has mappings - if so, create copy instead of update
  if (isUpdate && props.paramMappings.get(cleaned.SERVICE_PARAM_ID) > 0) {
    // Remove all fields that shouldn't be in create input
    delete cleaned.SERVICE_PARAM_ID;
    delete cleaned.CHANGED_BY_USER_ID;
    delete cleaned.CHANGED_DATE;
    delete cleaned.SERVICE_DISPLAY;
    delete cleaned['Service Provider'];
    
    // Set create fields
    cleaned.CREATED_DATE = getCurrentDateString();
    cleaned.CREATED_BY_USER_ID = props.userProfileId || 1;
    
    return { cleanedFormData: cleaned, shouldCreateCopy: true };
  }
  
  return processGenericEntity(cleaned, isUpdate);
};

const processGenericEntity = (data, isUpdate) => {
  const cleaned = { ...data };
  
  // Remove display fields
  delete cleaned.SERVICE_DISPLAY;
  delete cleaned['Service Provider'];
  // delete cleaned.PRODUCT_ID;
  
  // Remove display fields based on config
  if (props.config?.fieldsToRemove) {
    props.config.fieldsToRemove.forEach(field => {
      delete cleaned[field];
    });
  }
  
  if (isUpdate) {
    // Keep required fields for updates based on config
    if (!props.config?.keepAuditFieldsOnUpdate) {
      delete cleaned.CREATED_BY_USER_ID;
      delete cleaned.CREATED_DATE;
    }
    // Only set audit fields if they exist in formFields
    if (props.formFields.some(field => field.name === 'CHANGED_DATE')) {
      cleaned.CHANGED_DATE = getCurrentDateString();
    }
    if (props.formFields.some(field => field.name === 'CHANGED_BY_USER_ID')) {
      cleaned.CHANGED_BY_USER_ID = props.userProfileId || 1;
    }
    // Remove audit fields that don't exist in this entity's schema
    if (!props.formFields.some(field => field.name === 'CHANGED_BY_USER_ID')) {
      delete cleaned.CHANGED_BY_USER_ID;
    }
    if (!props.formFields.some(field => field.name === 'CREATED_BY_USER_ID')) {
      delete cleaned.CREATED_BY_USER_ID;
    }
  } else {
    delete cleaned[props.config.idField];
    delete cleaned.CHANGED_BY_USER_ID;
    delete cleaned.CHANGED_DATE;
    // Only set audit fields if they exist in formFields
    if (props.formFields.some(field => field.name === 'CREATED_DATE')) {
      cleaned.CREATED_DATE = getCurrentDateString();
    }
    if (props.formFields.some(field => field.name === 'CREATED_BY_USER_ID')) {
      cleaned.CREATED_BY_USER_ID = props.userProfileId || 1;
    }
    // Remove audit fields that don't exist in this entity's schema
    if (!props.formFields.some(field => field.name === 'CREATED_BY_USER_ID')) {
      delete cleaned.CREATED_BY_USER_ID;
    }
    if (!props.formFields.some(field => field.name === 'CREATED_DATE')) {
      delete cleaned.CREATED_DATE;
    }
  }
  
  return cleaned;
};

defineExpose({
  processFormData
});
</script>