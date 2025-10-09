export default {
  name: 'ORIGIN_PRODUCT',
  idField: 'ORIGIN_PRODUCT_ID',
  
  // Form processing configuration
  keepAuditFieldsOnUpdate: false,
  
  // Environment copy configuration
  preserveOnCopy: ['ORIGIN_PRODUCT_ID'],
  
  // Environment comparison configuration
  comparisonConfig: {
    matchingFields: ['VENDOR_NAME'],
    stringMatchFields: ['VENDOR_NAME'],
    stringMatchThreshold: 0.50
  },
  
  // Fields configuration
  fields: [
    "ORIGIN_PRODUCT_ID",
    "VENDOR_NAME",
    "PRODUCT_ID",
    "PSCU_CLIENT_ID",
    "PRODUCT_DESC",
    "PARTNER_CODE",
    "CREATED_BY_USER_ID",
    "CREATED_DATE",
    "CHANGED_BY_USER_ID",
    "CHANGED_DATE"
  ],
  
  // Form fields configuration
  formFields: [
    {
      "name": "VENDOR_NAME",
      "type": "text",
      "required": true,
      "disabled": false
    },
    {
      "name": "PRODUCT_ID",
      "type": "text",
      "required": true,
      "disabled": false
    },
    {
      "name": "PSCU_CLIENT_ID",
      "type": "number",
      "required": true,
      "disabled": false
    },
    {
      "name": "PRODUCT_DESC",
      "type": "text",
      "required": true,
      "disabled": false
    },
    {
      "name": "PARTNER_CODE",
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