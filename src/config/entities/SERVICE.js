export default {
  name: 'SERVICE',
  idField: 'SERVICE_ID',
  
  // Form processing configuration
  keepAuditFieldsOnUpdate: false,
  
  // Environment copy configuration
  preserveOnCopy: ['SERVICE_ID'],
  
  // Foreign key configuration for table display
  foreignKeys: {
    SERVICE_PROVIDER_ID: {
      table: 'SERVICE_PROVIDER',
      valueField: 'SERVICE_PROVIDER_ID',
      displayField: 'SERVICE_PROVIDER_NAME'
    }
  },
  
  // Fields to remove before GraphQL mutations
  fieldsToRemove: ['SERVICE_PROVIDER_ID_DISPLAY'],
  
  // Environment comparison configuration
  comparisonConfig: {
    matchingFields: ['SECRET_NAME'],
    stringMatchFields: ['SECRET_NAME'],
    stringMatchThreshold: 0.50
  },
  
  // Relationship counting configuration
  relationships: {
    parameters: {
      query: 'listServiceParams',
      dataKey: 'listSERVICE_PARAMS',
      countFields: ['SERVICE_ID']
    },
    stepMappings: {
      query: 'listStepServiceMappings',
      dataKey: 'listSTEP_SERVICE_MAPPINGS', 
      countFields: ['SERVICE_ID']
    }
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
      "type": "select",
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
      "type": "select",
      "required": false,
      "disabled": false,
      "options": [
        { "value": "get", "label": "GET" },
        { "value": "post", "label": "POST" },
        { "value": "put", "label": "PUT" },
        { "value": "delete", "label": "DELETE" }
      ]
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