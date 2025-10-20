export default {
  name: 'REDIRECT_URL',
  idField: 'REDIRECT_URL_ID',
  
  // Data loading configuration
  loadProductOptions: true,
  hasFilters: true,
  
  // Form processing configuration
  keepAuditFieldsOnUpdate: false,
  
  // Environment copy configuration
  preserveOnCopy: ['REDIRECT_URL_ID'],
  
  // // Environment comparison configuration
  // comparisonConfig: {
  //   matchingFields: ['ORIGIN_PRODUCT_ID'],
  //   stringMatchFields: ['ORIGIN_PRODUCT_ID'],
  //   stringMatchThreshold: 0.50
  // },

    // Environment comparison configuration
  comparisonConfig: {
    matchingFields: ['ORIGIN_PRODUCT_ID'],
    stringMatchFields: ['ORIGIN_PRODUCT_ID', 'URL', 'URL_TYPE_CODE', 'RESPONSE_TEXT'],
    comparisonFields: ['ORIGIN_PRODUCT_ID', 'URL_TYPE_CODE', 'URL', 'RESPONSE_TEXT'],
    // Use display values for comparison instead of raw foreign key IDs
    useDisplayValues: {
      'ORIGIN_PRODUCT_ID': 'PRODUCT_ID'
    },
    // Display only the business values in comparison, not the IDs
    displayFieldMapping: {
      'ORIGIN_PRODUCT_ID': 'PRODUCT_ID'
    }
  },

    // Foreign key lookups (matching FILTER_CRITERIA pattern)
  foreignKeys: {
    ORIGIN_PRODUCT_ID: {
      table: 'ORIGIN_PRODUCT',
      valueField: 'ORIGIN_PRODUCT_ID',
      displayField: 'PRODUCT_ID'
    }
  },
  
  // Field lookups for display enhancement
  fieldLookups: {
    ORIGIN_PRODUCT_ID: {
      lookupTable: 'ORIGIN_PRODUCT',
      foreignKey: 'ORIGIN_PRODUCT_ID',
      displayField: 'PRODUCT_ID',
      displayFormat: '{ORIGIN_PRODUCT_ID}: {PRODUCT_ID}'
    },
    URL_TYPE_CODE: {
      lookupTable: 'static',
      options: {
        'N': 'N: New',
        'E': 'E: Existing'
      }
    }
  },
  
  // Foreign key auto-creation configuration
  autoCreateForeignKeys: {
    ORIGIN_PRODUCT_ID: {
      entity: 'ORIGIN_PRODUCT',
      matchFields: ['PRODUCT_ID'],
      copyFields: ['PRODUCT_ID', 'VENDOR_NAME', 'PRODUCT_DESC', 'PSCU_CLIENT_ID', 'PARTNER_CODE']
    }
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
  fieldsToRemove: ["ORIGIN_PRODUCT_ID_DISPLAY"],
  
  // Data loading configuration to match FILTER_CRITERIA
  loadProductOptions: true,
  
  // Form fields configuration
  formFields: [
    {
      "name": "ORIGIN_PRODUCT_ID",
      "type": "select",
      "required": true,
      "disabled": false
    },
    {
      "name": "URL_TYPE_CODE",
      "type": "select",
      "required": true,
      "disabled": false,
      "options": [
        { "value": "N", "label": "N - New" },
        { "value": "E", "label": "E - Existing" }
      ]
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