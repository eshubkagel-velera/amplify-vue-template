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