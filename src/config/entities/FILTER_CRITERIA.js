export default {
  name: 'FILTER_CRITERIA',
  idField: 'FILTER_CRITERIA_ID',
  
  // Form processing configuration
  keepAuditFieldsOnUpdate: false,
  
  // Environment copy configuration
  preserveOnCopy: ['FILTER_CRITERIA_ID'],
  
  // Environment comparison configuration
  comparisonConfig: {
    matchingFields: ['ORIGIN_PRODUCT_ID'],
    stringMatchFields: ['ORIGIN_PRODUCT_ID'],
    stringMatchThreshold: 0.50
  },
  
  // Fields configuration
  fields: [
    "FILTER_CRITERIA_ID",
    "ORIGIN_PRODUCT_ID",
    "STEP_TYPE_ID",
    "CRITERIA",
    "SEQUENCE_NBR",
    "CREATED_DATE",
    "CHANGED_DATE"
  ],
  
  // Foreign key lookups
  foreignKeys: {
    ORIGIN_PRODUCT_ID: {
      table: 'ORIGIN_PRODUCT',
      valueField: 'ORIGIN_PRODUCT_ID',
      displayField: 'PRODUCT_ID'
    },
    STEP_TYPE_ID: {
      table: 'STEP_TYPE',
      valueField: 'STEP_TYPE_ID',
      displayField: 'STEP_TYPE_NAME'
    }
  },
  
  // Field lookups for display enhancement
  fieldLookups: {
    ORIGIN_PRODUCT_ID: {
      lookupTable: 'ORIGIN_PRODUCT',
      foreignKey: 'ORIGIN_PRODUCT_ID',
      displayField: 'PRODUCT_ID',
      displayFormat: '{ORIGIN_PRODUCT_ID}: {PRODUCT_ID}'
    },
    STEP_TYPE_ID: {
      lookupTable: 'STEP_TYPE',
      foreignKey: 'STEP_TYPE_ID',
      displayField: 'STEP_TYPE_NAME',
      displayFormat: '{STEP_TYPE_ID}: {STEP_TYPE_NAME}'
    }
  },
  
  // Form fields configuration
  formFields: [
    {
      "name": "ORIGIN_PRODUCT_ID",
      "type": "select",
      "required": true,
      "disabled": false,
      "options": []
    },
    {
      "name": "STEP_TYPE_ID",
      "type": "select",
      "required": true,
      "disabled": false,
      "options": []
    },
    {
      "name": "CRITERIA",
      "type": "text",
      "required": true,
      "disabled": false
    },
    {
      "name": "SEQUENCE_NBR",
      "type": "number",
      "required": true,
      "disabled": false
    },
    {
      "name": "CREATED_DATE",
      "type": "text",
      "required": false,
      "disabled": true
    },
    {
      "name": "CHANGED_DATE",
      "type": "text",
      "required": false,
      "disabled": true
    }
  ]
};