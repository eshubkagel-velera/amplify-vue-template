export default {
  name: 'SERVICE',
  idField: 'SERVICE_ID',
  
  // Data loading configuration
  loadServiceProviders: true,
  
  // Row actions
  hasRowActions: true,
  rowActions: ['serviceParams', 'serviceStepMapping'],
  
  // Form processing configuration
  fieldsToRemove: ['Service Provider', 'SERVICE_DISPLAY'],
  keepAuditFieldsOnUpdate: false,
  
  // Environment copy configuration
  preserveOnCopy: ['SERVICE_ID', 'SERVICE_PROVIDER_ID'],
  
  // Environment comparison configuration
  comparisonConfig: {
    matchingFields: ['Service Provider', 'URI'],
    comparisonFields: ['Service Provider', 'URI', 'SECRET_NAME', 'REQUEST_TYPE']
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
    }
  ] },
    { name: 'URI', type: 'text', required: true, disabled: false },
    { name: 'SECRET_NAME', type: 'text', required: false, disabled: false },
    { name: 'REQUEST_TYPE', type: 'select', required: false, disabled: false, options: [
      { value: 'get', label: 'GET' },
      { value: 'post', label: 'POST' },
      { value: 'put', label: 'PUT' },
      { value: 'delete', label: 'DELETE' }
    ] },
    { name: 'CREATED_BY_USER_ID', type: 'number', required: true, disabled: false },
    { name: 'CREATED_DATE', type: 'date', required: true, disabled: true }
  ],
  
  // Row actions configuration
  hasRowActions: true,
  
  // Field lookups configuration
  fieldLookups: {
    'Service Provider': {
      lookupTable: 'SERVICE_PROVIDER',
      foreignKey: 'SERVICE_PROVIDER_ID',
      displayField: 'SERVICE_PROVIDER_NAME',
      displayFormat: '{SERVICE_PROVIDER_NAME}'
    }
  }
};