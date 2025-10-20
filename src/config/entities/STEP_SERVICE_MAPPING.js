export default {
  name: 'STEP_SERVICE_MAPPING',
  idField: 'STEP_SERVICE_MAPPING_ID',
  
  // Form processing configuration
  keepAuditFieldsOnUpdate: false,
  hasAuditFields: false,
  
  // Environment copy configuration
  preserveOnCopy: ['STEP_SERVICE_MAPPING_ID'],
  
  // Foreign key configuration for table display
  foreignKeys: {
    STEP_TYPE_ID: {
      table: 'STEP_TYPE',
      valueField: 'STEP_TYPE_ID',
      displayField: 'STEP_TYPE_NAME'
    },
    SERVICE_ID: {
      table: 'SERVICE',
      valueField: 'SERVICE_ID',
      displayField: 'URI'
    }
  },
  
  // Fields to remove before GraphQL mutations
  fieldsToRemove: ['STEP_TYPE_ID_DISPLAY', 'SERVICE_ID_DISPLAY'],
  
  // Field lookups for display enhancement
  fieldLookups: {
    STEP_TYPE_ID: {
      lookupTable: 'STEP_TYPE',
      foreignKey: 'STEP_TYPE_ID',
      displayField: 'STEP_TYPE_NAME',
      displayFormat: '{STEP_TYPE_ID}: {STEP_TYPE_NAME}'
    },
    SERVICE_ID: {
      lookupTable: 'SERVICE',
      foreignKey: 'SERVICE_ID',
      displayField: 'URI',
      displayFormat: '{SERVICE_ID}: {URI}'
    }
  },
  
  // Auto-create missing foreign key records
  autoCreateForeignKeys: {
    STEP_TYPE_ID: {
      entity: 'STEP_TYPE',
      matchFields: ['STEP_TYPE_NAME'],
      copyFields: ['STEP_TYPE_NAME', 'STEP_TYPE_DESC', 'RESOURCE_NAME']
    },
    SERVICE_ID: {
      entity: 'SERVICE',
      matchFields: ['URI'],
      copyFields: ['SERVICE_PROVIDER_ID', 'URI', 'SECRET_NAME', 'REQUEST_TYPE']
    }
  },
  
  // Environment comparison configuration
  comparisonConfig: {
    matchingFields: ['STEP_TYPE_ID', 'SERVICE_ID'],
    comparisonFields: ['STEP_TYPE_ID', 'SERVICE_ID', 'SEQUENCE_NBR'],
    useDisplayValues: {
      'STEP_TYPE_ID': 'STEP_TYPE_NAME',
      'SERVICE_ID': 'URI'
    },
    displayFieldMapping: {
      'STEP_TYPE_ID': 'STEP_TYPE_NAME',
      'SERVICE_ID': 'URI'
    }
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
      "type": "select",
      "required": true,
      "disabled": false
    },
    {
      "name": "SERVICE_ID",
      "type": "select",
      "required": true,
      "disabled": false
    },
    {
      "name": "SEQUENCE_NBR",
      "type": "number",
      "required": false,
      "disabled": false,
      "defaultValue": 1
    }
  ]
};