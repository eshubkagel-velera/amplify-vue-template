export default {
  name: 'STEP_SERVICE_MAPPING',
  idField: 'STEP_SERVICE_MAPPING_ID',
  
  // Form processing configuration
  keepAuditFieldsOnUpdate: false,
  
  // Environment copy configuration
  preserveOnCopy: ['STEP_SERVICE_MAPPING_ID'],
  
  // Environment comparison configuration
  comparisonConfig: {
    matchingFields: ['STEP_TYPE_ID'],
    stringMatchFields: ['STEP_TYPE_ID'],
    stringMatchThreshold: 0.50
  },
  
  // Fields configuration
  fields: [
    "STEP_SERVICE_MAPPING_ID",
    "STEP_TYPE_ID",
    "SERVICE_ID",
    "SEQUENCE_NBR"
  ],
  
  // Form fields configuration
  formFields: [
    {
      "name": "STEP_TYPE_ID",
      "type": "number",
      "required": true,
      "disabled": false
    },
    {
      "name": "SERVICE_ID",
      "type": "number",
      "required": true,
      "disabled": false
    },
    {
      "name": "SEQUENCE_NBR",
      "type": "number",
      "required": false,
      "disabled": false
    }
  ]
};