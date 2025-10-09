export default {
  name: 'SERVICE_PARAM',
  idField: 'SERVICE_PARAM_ID',
  
  // Form processing configuration
  keepAuditFieldsOnUpdate: false,
  
  // Environment copy configuration
  preserveOnCopy: ['SERVICE_PARAM_ID'],
  
  // Environment comparison configuration
  comparisonConfig: {
    matchingFields: ['PARAM_NAME'],
    stringMatchFields: ['PARAM_NAME'],
    stringMatchThreshold: 0.50
  },
  
  // Fields configuration
  fields: [
    "SERVICE_PARAM_ID",
    "SERVICE_ID",
    "PARAM_NAME",
    "CREATED_BY_USER_ID",
    "CREATED_DATE",
    "CHANGED_BY_USER_ID",
    "CHANGED_DATE"
  ],
  
  // Form fields configuration
  formFields: [
    {
      "name": "SERVICE_ID",
      "type": "number",
      "required": true,
      "disabled": false
    },
    {
      "name": "PARAM_NAME",
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