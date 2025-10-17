export default {
  name: 'SERVICE_PARAM_MAPPING',
  idField: 'SERVICE_PARAM_MAPPING_ID',
  
  // Form processing configuration
  keepAuditFieldsOnUpdate: false,
  
  // Environment copy configuration
  preserveOnCopy: ['SERVICE_PARAM_MAPPING_ID'],
  
  // Data loading configuration
  loadProductOptions: true,
  
  // Foreign key configuration for table display
  foreignKeys: {
    ORIGIN_PRODUCT_ID: {
      table: 'ORIGIN_PRODUCT',
      valueField: 'ORIGIN_PRODUCT_ID',
      displayField: 'PRODUCT_NAME'
    },
    SOURCE_SERVICE_PARAM_ID: {
      table: 'SERVICE_PARAM',
      valueField: 'SERVICE_PARAM_ID',
      displayField: 'PARAM_NAME'
    },
    TARGET_SERVICE_PARAM_ID: {
      table: 'SERVICE_PARAM',
      valueField: 'SERVICE_PARAM_ID',
      displayField: 'PARAM_NAME'
    }
  },
  
  // Fields to remove before GraphQL mutations
  fieldsToRemove: ['ORIGIN_PRODUCT_ID_DISPLAY', 'SOURCE_SERVICE_PARAM_ID_DISPLAY', 'TARGET_SERVICE_PARAM_ID_DISPLAY'],
  
  // Integrated service selection for parameter filtering
  integratedFilters: {
    SOURCE_SERVICE_PARAM_ID: {
      filterField: 'SOURCE_SERVICE_ID',
      filterLabel: 'Source Service',
      filterSource: 'SERVICE',
      filterValueField: 'SERVICE_ID',
      filterDisplayField: 'URI'
    },
    TARGET_SERVICE_PARAM_ID: {
      filterField: 'TARGET_SERVICE_ID', 
      filterLabel: 'Target Service',
      filterSource: 'SERVICE',
      filterValueField: 'SERVICE_ID',
      filterDisplayField: 'URI'
    }
  },
  
  // Environment comparison configuration
  comparisonConfig: {
    matchingFields: ['ORIGIN_PRODUCT_ID'],
    stringMatchFields: ['ORIGIN_PRODUCT_ID'],
    stringMatchThreshold: 0.50
  },
  
  // Fields configuration
  fields: [
    "SERVICE_PARAM_MAPPING_ID",
    "ORIGIN_PRODUCT_ID",
    "SYSTEM_NBR",
    "PRIN_NBR",
    "AGENT_NBR",
    "SOURCE_SERVICE_PARAM_ID",
    "TARGET_SERVICE_PARAM_ID",
    "PLASTIC_TYPE_ID",
    "COMMENT_TEXT",
    "CREATED_BY_USER_ID",
    "CREATED_DATE",
    "CHANGED_BY_USER_ID",
    "CHANGED_DATE"
  ],
  
  // Form fields configuration
  formFields: [
    {
      "name": "ORIGIN_PRODUCT_ID",
      "type": "select",
      "required": true,
      "disabled": false
    },
    {
      "name": "SYSTEM_NBR",
      "type": "text",
      "required": false,
      "disabled": false
    },
    {
      "name": "PRIN_NBR",
      "type": "text",
      "required": false,
      "disabled": false
    },
    {
      "name": "AGENT_NBR",
      "type": "text",
      "required": false,
      "disabled": false
    },
    {
      "name": "SOURCE_SERVICE_PARAM_ID",
      "type": "select",
      "required": true,
      "disabled": false
    },
    {
      "name": "TARGET_SERVICE_PARAM_ID",
      "type": "select",
      "required": true,
      "disabled": false
    },
    {
      "name": "PLASTIC_TYPE_ID",
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