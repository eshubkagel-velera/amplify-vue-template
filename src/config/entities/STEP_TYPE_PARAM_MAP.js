export default {
  name: 'STEP_TYPE_PARAM_MAP',
  idField: 'STEP_TYPE_PARAM_MAP_ID',
  
  // Form processing configuration
  keepAuditFieldsOnUpdate: false,
  
  // Environment copy configuration
  preserveOnCopy: ['STEP_TYPE_PARAM_MAP_ID'],
  
  // Foreign key configuration for table display
  foreignKeys: {
    STEP_TYPE_ID: {
      table: 'STEP_TYPE',
      valueField: 'STEP_TYPE_ID',
      displayField: 'STEP_TYPE_NAME'
    }
  },
  
  // Custom display for SERVICE_PARAM_MAPPING_ID
  customDisplayFields: {
    SERVICE_PARAM_MAPPING_ID: {
      enhanceFunction: 'enhanceServiceParamMappingDisplay'
    }
  },
  
  // Fields to remove before GraphQL mutations
  fieldsToRemove: ['STEP_TYPE_ID_DISPLAY'],
  
  // Multiple integrated filters for SERVICE_PARAM_MAPPING_ID selection
  integratedFilters: {
    SERVICE_PARAM_MAPPING_ID: [
      {
        filterField: 'FILTER_PRODUCT_ID',
        filterLabel: 'Product',
        filterSource: 'ORIGIN_PRODUCT',
        filterValueField: 'ORIGIN_PRODUCT_ID',
        filterDisplayField: 'PRODUCT_ID'
      },
      {
        filterField: 'FILTER_SOURCE_SERVICE_ID',
        filterLabel: 'Source Service',
        filterSource: 'SERVICE',
        filterValueField: 'SERVICE_ID',
        filterDisplayField: 'URI'
      },
      {
        filterField: 'FILTER_SOURCE_PARAM_ID',
        filterLabel: 'Source Param',
        filterSource: 'SERVICE_PARAM',
        filterValueField: 'SERVICE_PARAM_ID',
        filterDisplayField: 'PARAM_NAME',
        dependsOn: 'FILTER_SOURCE_SERVICE_ID',
        parentField: 'SERVICE_ID'
      },
      {
        filterField: 'FILTER_TARGET_SERVICE_ID',
        filterLabel: 'Target Service',
        filterSource: 'SERVICE',
        filterValueField: 'SERVICE_ID',
        filterDisplayField: 'URI'
      },
      {
        filterField: 'FILTER_TARGET_PARAM_ID',
        filterLabel: 'Target Param',
        filterSource: 'SERVICE_PARAM',
        filterValueField: 'SERVICE_PARAM_ID',
        filterDisplayField: 'PARAM_NAME',
        dependsOn: 'FILTER_TARGET_SERVICE_ID',
        parentField: 'SERVICE_ID'
      }
    ]
  },
  
  // Environment comparison configuration
  comparisonConfig: {
    matchingFields: ['STEP_TYPE_ID'],
    stringMatchFields: ['STEP_TYPE_ID'],
    stringMatchThreshold: 0.50
  },
  
  // Fields configuration
  fields: [
    "STEP_TYPE_PARAM_MAP_ID",
    "STEP_TYPE_ID",
    "SERVICE_PARAM_MAPPING_ID",
    "CREATED_BY_USER_ID",
    "CREATED_DATE"
  ],
  
  // Form fields configuration
  formFields: [
    {
      "name": "STEP_TYPE_ID",
      "type": "select",
      "required": false,
      "disabled": false
    },
    {
      "name": "SERVICE_PARAM_MAPPING_ID",
      "type": "select",
      "required": true,
      "disabled": false
    },
    {
      "name": "CREATED_BY_USER_ID",
      "type": "text",
      "required": false,
      "disabled": false
    },
    {
      "name": "CREATED_DATE",
      "type": "text",
      "required": false,
      "disabled": true
    }
  ]
};