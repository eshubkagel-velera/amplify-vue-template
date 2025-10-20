export default {
  name: 'SERVICE_PARAM',
  idField: 'SERVICE_PARAM_ID',
  
  // Form processing configuration
  keepAuditFieldsOnUpdate: false,
  
  // Environment copy configuration
  preserveOnCopy: ['SERVICE_PARAM_ID'],
  
  // Foreign key configuration for table display
  foreignKeys: {
    SERVICE_ID: {
      table: 'SERVICE',
      valueField: 'SERVICE_ID',
      displayField: 'URI'
    }
  },
  
  // Fields to remove before GraphQL mutations
  fieldsToRemove: ['SERVICE_ID_DISPLAY'],
  
  // Field lookups for display enhancement
  fieldLookups: {
    SERVICE_ID: {
      lookupTable: 'SERVICE',
      foreignKey: 'SERVICE_ID',
      displayField: 'URI',
      displayFormat: '{SERVICE_ID}: {URI}'
    }
  },
  
  // Auto-create missing foreign key records
  autoCreateForeignKeys: {
    SERVICE_ID: {
      entity: 'SERVICE',
      matchFields: ['URI'],
      copyFields: ['SERVICE_PROVIDER_ID', 'URI', 'SECRET_NAME', 'REQUEST_TYPE']
    }
  },
  
  // Environment comparison configuration
  comparisonConfig: {
    matchingFields: ['PARAM_NAME'],
    stringMatchFields: ['PARAM_NAME'],
    stringMatchThreshold: 0.50,
    comparisonFields: ['SERVICE_ID', 'PARAM_NAME'],
    useDisplayValues: {
      'SERVICE_ID': 'URI'
    },
    displayFieldMapping: {
      'SERVICE_ID': 'URI'
    }
  },
  
  // Relationship counting configuration
  relationships: {
    mappings: {
      query: 'listServiceParamMappings',
      dataKey: 'listSERVICE_PARAM_MAPPINGS',
      countFields: ['SOURCE_SERVICE_PARAM_ID', 'TARGET_SERVICE_PARAM_ID']
    }
  },
  
  // Auto-fill configuration
  autoFillFromFilter: {
    filterField: 'selectedServiceFilter',
    formField: 'SERVICE_ID'
  },
  
  // Filter configuration
  hasFilters: true,
  filterType: 'service',
  requiresServiceFilter: true,
  
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
      "type": "select",
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