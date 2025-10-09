export default {
  name: 'SERVICE_PROVIDER',
  idField: 'SERVICE_PROVIDER_ID',
  
  // Form processing configuration
  keepAuditFieldsOnUpdate: false,
  
  // Environment copy configuration
  preserveOnCopy: ['SERVICE_PROVIDER_ID'],
  
  // Environment comparison configuration
  comparisonConfig: {
    matchingFields: ['SERVICE_PROVIDER_NAME'],
    stringMatchFields: ['SERVICE_PROVIDER_NAME'],
    stringMatchThreshold: 0.50
  },
  
  // Fields configuration
  fields: [
    "SERVICE_PROVIDER_ID",
    "SERVICE_PROVIDER_NAME",
    "CREATED_BY_USER_ID",
    "CREATED_DATE",
    "CHANGED_BY_USER_ID",
    "CHANGED_DATE"
  ],
  
  // Form fields configuration
  formFields: [
    {
      "name": "SERVICE_PROVIDER_NAME",
      "type": "text",
      "required": true,
      "disabled": false
    },
    {
      "name": "CREATED_BY_USER_ID",
      "type": "number",
      "required": false,
      "disabled": false
    },
    {
      "name": "CREATED_DATE",
      "type": "text",
      "required": false,
      "disabled": true
    },
    {
      "name": "CHANGED_BY_USER_ID",
      "type": "number",
      "required": false,
      "disabled": false
    },
    {
      "name": "CHANGED_DATE",
      "type": "text",
      "required": false,
      "disabled": true
    }
  ]
};