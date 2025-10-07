export default {
  name: 'SERVICE_PARAM_MAPPING',
  idField: 'SERVICE_PARAM_MAPPING_ID',
  
  // Form processing configuration
  keepAuditFieldsOnUpdate: false,
  
  // Environment copy configuration
  preserveOnCopy: ['SERVICE_PARAM_MAPPING_ID'],
  
  // Environment comparison configuration
  comparisonConfig: {
    matchingFields: ['Target Service', 'Source Service', 'Target Param Name', 'Target Expr', 'Source Param Name', 'Source Expr']
  },
  
  // Fields configuration
  fields: ['SERVICE_PARAM_MAPPING_ID', 'ORIGIN_PRODUCT_ID', 'SOURCE_SERVICE_PARAM_ID', 'TARGET_SERVICE_PARAM_ID', 'CREATED_BY_USER_ID', 'CREATED_DATE'],
  
  // Form fields configuration
  formFields: [
    { name: 'ORIGIN_PRODUCT_ID', type: 'number', required: true, disabled: false },
    { name: 'SYSTEM_NBR', type: 'text', required: false, disabled: false },
    { name: 'PRIN_NBR', type: 'text', required: false, disabled: false },
    { name: 'AGENT_NBR', type: 'text', required: false, disabled: false },
    { name: 'SOURCE_SERVICE_PARAM_ID', type: 'number', required: true, disabled: false },
    { name: 'TARGET_SERVICE_PARAM_ID', type: 'number', required: true, disabled: false },
    { name: 'CREATED_BY_USER_ID', type: 'number', required: true, disabled: false },
    { name: 'CREATED_DATE', type: 'date', required: true, disabled: true }
  ]
};