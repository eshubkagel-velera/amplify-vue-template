export default {
  name: 'REDIRECT_URL',
  idField: 'REDIRECT_URL_ID',
  
  // Form processing configuration
  keepAuditFieldsOnUpdate: false,
  
  // Environment copy configuration
  preserveOnCopy: ['REDIRECT_URL_ID'],
  
  // Environment comparison configuration
  comparisonConfig: {
    matchingFields: ['ORIGIN_PRODUCT_ID'],
    stringMatchFields: ['ORIGIN_PRODUCT_ID'],
    stringMatchThreshold: 0.50
  },
  
  // Fields configuration
  fields: [
    "REDIRECT_URL_ID",
    "ORIGIN_PRODUCT_ID",
    "URL_TYPE_CODE",
    "URL",
    "RESPONSE_TEXT",
    "CREATED_BY_USER_ID",
    "CREATED_DATE",
    "CHANGED_BY_USER_ID",
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
      "name": "URL_TYPE_CODE",
      "type": "text",
      "required": true,
      "disabled": false
    },
    {
      "name": "URL",
      "type": "text",
      "required": true,
      "disabled": false
    },
    {
      "name": "RESPONSE_TEXT",
      "type": "text",
      "required": false,
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