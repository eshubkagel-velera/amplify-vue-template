export default {
  name: 'STEP_TYPE',
  idField: 'STEP_TYPE_ID',
  
  // Row actions configuration
  hasRowActions: true,
  rowActions: ['stepServices'],
  
  // Form processing configuration
  keepAuditFieldsOnUpdate: false,
  
  // Environment copy configuration
  preserveOnCopy: ['STEP_TYPE_ID'],
  
  // Environment comparison configuration
  comparisonConfig: {
    matchingFields: ['STEP_TYPE_NAME', 'STEP_TYPE_DESC', 'RESOURCE_NAME'],
    stringMatchFields: ['STEP_TYPE_NAME', 'STEP_TYPE_DESC', 'RESOURCE_NAME'],
    stringMatchThreshold: 0.80
  },
  
  // Fields configuration
  fields: [
    "STEP_TYPE_ID",
    "STEP_TYPE_NAME",
    "STEP_TYPE_DESC",
    "RESOURCE_NAME",
    "CREATED_BY_USER_ID",
    "CREATED_DATE",
    "CHANGED_BY_USER_ID",
    "CHANGED_DATE"
  ],
  
  // Form fields configuration
  formFields: [
    {
      "name": "STEP_TYPE_NAME",
      "type": "text",
      "required": true,
      "disabled": false
    },
    {
      "name": "STEP_TYPE_DESC",
      "type": "text",
      "required": false,
      "disabled": false
    },
    {
      "name": "RESOURCE_NAME",
      "type": "text",
      "required": true,
      "disabled": false
    }
  ],
  
  // Row actions configuration
  hasRowActions: true
};