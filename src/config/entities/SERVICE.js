export default {
  name: 'SERVICE',
  idField: 'SERVICE_ID',
  
  // Form processing configuration
  keepAuditFieldsOnUpdate: false,
  
  // Environment copy configuration
  preserveOnCopy: ['SERVICE_ID'],
  
  // Environment comparison configuration
  comparisonConfig: {
    matchingFields: ['SECRET_NAME'],
    stringMatchFields: ['SECRET_NAME'],
    stringMatchThreshold: 0.50
  },
  
  // Fields configuration
  fields: [
    "SERVICE_ID",
    "SERVICE_PROVIDER_ID",
    "URI",
    "SECRET_NAME",
    "REQUEST_TYPE",
    "CREATED_BY_USER_ID",
    "CREATED_DATE",
    "CHANGED_BY_USER_ID",
    "CHANGED_DATE"
  ],
  
  // Form fields configuration
  formFields: [
    {
      "name": "SERVICE_PROVIDER_ID",
      "type": "number",
      "required": true,
      "disabled": false
    },
    {
      "name": "URI",
      "type": "text",
      "required": true,
      "disabled": false
    },
    {
      "name": "SECRET_NAME",
      "type": "text",
      "required": false,
      "disabled": false
    },
    {
      "name": "REQUEST_TYPE",
      "type": "text",
      "required": false,
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