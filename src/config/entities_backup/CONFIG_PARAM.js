export default {
  name: 'CONFIG_PARAM',
  idField: 'CONFIG_PARAM_ID',
  
  // Form processing configuration
  keepAuditFieldsOnUpdate: false,
  
  // Environment copy configuration
  preserveOnCopy: ['CONFIG_PARAM_ID'],
  
  // Environment comparison configuration
  comparisonConfig: {
    matchingFields: ['CONFIG_NAME'],
    stringMatchFields: ['CONFIG_NAME'],
    stringMatchThreshold: 0.50
  },
  
  // Fields configuration
  fields: [
    "CONFIG_PARAM_ID",
    "CONFIG_NAME",
    "CONFIG_VALUE",
    "DESCRIPTION",
    "CREATED_DATE",
    "CHANGED_DATE"
  ],
  
  // Form fields configuration
  formFields: [
    {
      "name": "CONFIG_NAME",
      "type": "text",
      "required": true,
      "disabled": false
    },
    {
      "name": "CONFIG_VALUE",
      "type": "text",
      "required": true,
      "disabled": false
    },
    {
      "name": "DESCRIPTION",
      "type": "text",
      "required": false,
      "disabled": false
    }
  ]
};