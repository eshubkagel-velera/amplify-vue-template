export default {
  name: 'SORT_CRITERIA',
  idField: 'SORT_CRITERIA_ID',
  
  // Form processing configuration
  keepAuditFieldsOnUpdate: false,
  hasAuditFields: false,
  
  // Environment copy configuration
  preserveOnCopy: ['SORT_CRITERIA_ID'],
  
  // Foreign key configuration for table display
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
  
  // Fields to remove before GraphQL mutations
  fieldsToRemove: ['ORIGIN_PRODUCT_ID_DISPLAY', 'STEP_TYPE_ID_DISPLAY'],
  
  // Environment comparison configuration
  comparisonConfig: {
    matchingFields: ['ORIGIN_PRODUCT_ID'],
    stringMatchFields: ['ORIGIN_PRODUCT_ID'],
    stringMatchThreshold: 0.50
  },
  
  // Fields configuration
  fields: [
    "SORT_CRITERIA_ID",
    "ORIGIN_PRODUCT_ID",
    "STEP_TYPE_ID",
    "JSON_PATH",
    "SORT_ORDER",
    "SORT_PRIORITY",
    "SEQUENCE_NBR",
    "CREATED_DATE",
    "CHANGED_DATE"
  ],
  
  // Form fields configuration
  formFields: [
    {
      "name": "ORIGIN_PRODUCT_ID",
      "type": "select",
      "required": true,
      "disabled": false
    },
    {
      "name": "STEP_TYPE_ID",
      "type": "select",
      "required": true,
      "disabled": false
    },
    {
      "name": "JSON_PATH",
      "type": "text",
      "required": true,
      "disabled": false
    },
    {
      "name": "SORT_ORDER",
      "type": "text",
      "required": true,
      "disabled": false
    },
    {
      "name": "SORT_PRIORITY",
      "type": "number",
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