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
    cleanedFormData = processServiceParam(cleanedFormData, isUpdate);
  } else {
    cleanedFormData = processGenericEntity(cleanedFormData, isUpdate);
  }
  
  emit('formProcessed', { cleanedFormData, shouldCreateCopy: false });
  return cleanedFormData;
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
  const cleaned = { ...data };
  
  // Check if param has mappings - if so, create copy instead of update
  if (isUpdate && props.paramMappings.get(cleaned.SERVICE_PARAM_ID) > 0) {
    delete cleaned.SERVICE_PARAM_ID;
    delete cleaned.CHANGED_BY_USER_ID;
    delete cleaned.CHANGED_DATE;
    cleaned.CREATED_DATE = getCurrentDateString();
    cleaned.CREATED_BY_USER_ID = props.userProfileId || 1;
    emit('formProcessed', { cleanedFormData: cleaned, shouldCreateCopy: true });
    return cleaned;
  }
  
  return processGenericEntity(cleaned, isUpdate);
};

const processGenericEntity = (data, isUpdate) => {
  const cleaned = { ...data };
  
  // Remove display fields
  delete cleaned.SERVICE_DISPLAY;
  delete cleaned['Service Provider'];
  
  if (isUpdate) {
    delete cleaned.CREATED_BY_USER_ID;
    delete cleaned.CREATED_DATE;
    cleaned.CHANGED_DATE = getCurrentDateString();
    cleaned.CHANGED_BY_USER_ID = props.userProfileId || 1;
  } else {
    delete cleaned[props.config.idField];
    delete cleaned.CHANGED_BY_USER_ID;
    delete cleaned.CHANGED_DATE;
    cleaned.CREATED_DATE = getCurrentDateString();
    cleaned.CREATED_BY_USER_ID = props.userProfileId || 1;
  }
  
  return cleaned;
};

defineExpose({
  processFormData
});
</script>