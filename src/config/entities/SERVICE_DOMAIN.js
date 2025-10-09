export default {
  name: 'SERVICE_DOMAIN',
  idField: 'SERVICE_DOMAIN_ID',
  
  // Form processing configuration
  keepAuditFieldsOnUpdate: false,
  
  // Environment copy configuration
  preserveOnCopy: ['SERVICE_DOMAIN_ID'],
  
  // Environment comparison configuration
  comparisonConfig: {
    matchingFields: ['DOMAIN_URL'],
    stringMatchFields: ['DOMAIN_URL'],
    stringMatchThreshold: 0.50
  },
  
  // Fields configuration
  fields: [
    "SERVICE_DOMAIN_ID",
    "DOMAIN_URL",
    "SERVICE_PROVIDER_ID",
    "CREATED_DATE",
    "CHANGED_DATE"
  ],
  
  // Form fields configuration
  formFields: [
    {
      "name": "DOMAIN_URL",
      "type": "text",
      "required": false,
      "disabled": false
    },
    {
      "name": "SERVICE_PROVIDER_ID",
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