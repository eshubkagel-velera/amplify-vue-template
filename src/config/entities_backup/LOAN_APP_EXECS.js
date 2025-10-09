export default {
  name: 'LOAN_APP_EXECS',
  idField: 'LOAN_APP_EXEC_ID',
  
  // Form processing configuration
  keepAuditFieldsOnUpdate: false,
  
  // Environment copy configuration
  preserveOnCopy: ['LOAN_APP_EXEC_ID'],
  
  // Environment comparison configuration
  comparisonConfig: {
    matchingFields: ['LOAN_APP_ID'],
    stringMatchFields: ['LOAN_APP_ID'],
    stringMatchThreshold: 0.50
  },
  
  // Fields configuration
  fields: [
    "LOAN_APP_EXEC_ID",
    "LOAN_APP_ID",
    "AWS_EXEC_ID",
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
      "name": "AWS_EXEC_ID",
      "type": "text",
      "required": true,
      "disabled": false
    }
  ]
};