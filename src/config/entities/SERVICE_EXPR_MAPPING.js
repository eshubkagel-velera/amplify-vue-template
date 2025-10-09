export default {
  name: 'SERVICE_EXPR_MAPPING',
  idField: 'SERVICE_EXPR_MAPPING_ID',
  
  // Form processing configuration
  keepAuditFieldsOnUpdate: false,
  
  // Environment copy configuration
  preserveOnCopy: ['SERVICE_EXPR_MAPPING_ID'],
  
  // Environment comparison configuration
  comparisonConfig: {
    matchingFields: ['SERVICE_PARAM_MAPPING_ID'],
    stringMatchFields: ['SERVICE_PARAM_MAPPING_ID'],
    stringMatchThreshold: 0.50
  },
  
  // Fields configuration
  fields: [
    "SERVICE_EXPR_MAPPING_ID",
    "SERVICE_PARAM_MAPPING_ID",
    "SOURCE_EXPR",
    "TARGET_EXPR",
    "COMMENT_TEXT",
    "CREATED_BY_USER_ID",
    "CREATED_DATE",
    "CHANGED_BY_USER_ID",
    "CHANGED_DATE"
  ],
  
  // Form fields configuration
  formFields: [
    {
      "name": "SERVICE_PARAM_MAPPING_ID",
      "type": "number",
      "required": true,
      "disabled": false
    },
    {
      "name": "SOURCE_EXPR",
      "type": "text",
      "required": false,
      "disabled": false
    },
    {
      "name": "TARGET_EXPR",
      "type": "text",
      "required": false,
      "disabled": false
    },
    {
      "name": "COMMENT_TEXT",
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