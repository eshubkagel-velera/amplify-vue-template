export default {
  name: 'SORT_CRITERIA',
  idField: 'SORT_CRITERIA_ID',
  
  // Form processing configuration
  keepAuditFieldsOnUpdate: false,
  
  // Environment copy configuration
  preserveOnCopy: ['SORT_CRITERIA_ID'],
  
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
      "type": "number",
      "required": true,
      "disabled": false
    },
    {
      "name": "STEP_TYPE_ID",
      "type": "number",
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
    }
  ]
};