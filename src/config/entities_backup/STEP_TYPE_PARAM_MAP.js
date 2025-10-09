export default {
  name: 'STEP_TYPE_PARAM_MAP',
  idField: 'STEP_TYPE_PARAM_MAP_ID',
  
  // Form processing configuration
  keepAuditFieldsOnUpdate: false,
  
  // Environment copy configuration
  preserveOnCopy: ['STEP_TYPE_PARAM_MAP_ID'],
  
  // Environment comparison configuration
  comparisonConfig: {
    matchingFields: ['STEP_TYPE_ID'],
    stringMatchFields: ['STEP_TYPE_ID'],
    stringMatchThreshold: 0.50
  },
  
  // Fields configuration
  fields: [
    "STEP_TYPE_PARAM_MAP_ID",
    "STEP_TYPE_ID",
    "SERVICE_PARAM_MAPPING_ID",
    "CREATED_BY_USER_ID",
    "CREATED_DATE"
  ],
  
  // Form fields configuration
  formFields: [
    {
      "name": "STEP_TYPE_ID",
      "type": "number",
      "required": false,
      "disabled": false
    },
    {
      "name": "SERVICE_PARAM_MAPPING_ID",
      "type": "number",
      "required": true,
      "disabled": false
    }
  ]
};