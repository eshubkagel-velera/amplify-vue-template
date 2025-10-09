export default {
  name: 'LOAN_APP',
  idField: 'LOAN_APP_ID',
  
  // Form processing configuration
  keepAuditFieldsOnUpdate: false,
  
  // Environment copy configuration
  preserveOnCopy: ['LOAN_APP_ID'],
  
  // Environment comparison configuration
  comparisonConfig: {
    matchingFields: ['ORIGIN_LOAN_APP_ID'],
    stringMatchFields: ['ORIGIN_LOAN_APP_ID'],
    stringMatchThreshold: 0.50
  },
  
  // Fields configuration
  fields: [
    "LOAN_APP_ID",
    "ORIGIN_LOAN_APP_ID",
    "ORIGIN_PRODUCT_ID",
    "PROCESS_FLAG",
    "EXEC_ID",
    "CREATED_DATE",
    "CHANGED_DATE"
  ],
  
  // Form fields configuration
  formFields: [
    {
      "name": "ORIGIN_LOAN_APP_ID",
      "type": "text",
      "required": true,
      "disabled": false
    },
    {
      "name": "ORIGIN_PRODUCT_ID",
      "type": "number",
      "required": true,
      "disabled": false
    },
    {
      "name": "PROCESS_FLAG",
      "type": "text",
      "required": true,
      "disabled": false
    },
    {
      "name": "EXEC_ID",
      "type": "text",
      "required": false,
      "disabled": false
    }
  ]
};