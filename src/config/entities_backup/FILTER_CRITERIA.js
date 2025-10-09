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
    }
  ]
};