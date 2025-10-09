export default {
  name: 'LOAN_APP_STEP_STATUS',
  idField: 'LOAN_APP_STEP_STATUS_ID',
  
  // Form processing configuration
  keepAuditFieldsOnUpdate: false,
  
  // Environment copy configuration
  preserveOnCopy: ['LOAN_APP_STEP_STATUS_ID'],
  
  // Environment comparison configuration
  comparisonConfig: {
    matchingFields: ['LOAN_APP_ID'],
    stringMatchFields: ['LOAN_APP_ID'],
    stringMatchThreshold: 0.50
  },
  
  // Fields configuration
  fields: [
    "LOAN_APP_STEP_STATUS_ID",
    "LOAN_APP_ID",
    "LOAN_APP_EXEC_ID",
    "STEP_TYPE_ID",
    "COMPLETE_FLAG",
    "SEQUENCE_NBR",
    "IDX_JSON_PATH",
    "RESPONSE_TEXT",
    "OUTPUT_JSON",
    "CREATED_DATE"
  ],
  
  // Form fields configuration
  formFields: [
    {
      "name": "LOAN_APP_ID",
      "type": "number",
      "required": true,
      "disabled": false
    },
    {
      "name": "LOAN_APP_EXEC_ID",
      "type": "number",
      "required": false,
      "disabled": false
    },
    {
      "name": "STEP_TYPE_ID",
      "type": "number",
      "required": true,
      "disabled": false
    },
    {
      "name": "COMPLETE_FLAG",
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
      "name": "IDX_JSON_PATH",
      "type": "text",
      "required": false,
      "disabled": false
    },
    {
      "name": "RESPONSE_TEXT",
      "type": "text",
      "required": false,
      "disabled": false
    },
    {
      "name": "OUTPUT_JSON",
      "type": "text",
      "required": false,
      "disabled": false
    }
  ]
};