export default {
  name: 'FILTER_CRITERIA',
  idField: 'FILTER_CRITERIA_ID',
  
  // Form processing configuration
  keepAuditFieldsOnUpdate: false,
  
  // Environment copy configuration
  preserveOnCopy: ['FILTER_CRITERIA_ID'],
  
  // Environment comparison configuration
  comparisonConfig: {
    matchingFields: ['CRITERIA', 'SEQUENCE_NBR'],
    comparisonFields: ['ORIGIN_PRODUCT_ID', 'STEP_TYPE_ID', 'CRITERIA', 'SEQUENCE_NBR'],
    // Use display values for comparison instead of raw foreign key IDs
    useDisplayValues: {
      'ORIGIN_PRODUCT_ID': 'PRODUCT_ID',
      'STEP_TYPE_ID': 'STEP_TYPE_NAME'
    },
    // Display only the business values in comparison, not the IDs
    displayFieldMapping: {
      'ORIGIN_PRODUCT_ID': 'PRODUCT_ID',
      'STEP_TYPE_ID': 'STEP_TYPE_NAME'
    }
  },
  
  // Fields configuration
  fields: [
    "FILTER_CRITERIA_ID",
    "ORIGIN_PRODUCT_ID",
    "STEP_TYPE_ID",
    "CRITERIA",
    "SEQUENCE_NBR",
    "CREATED_DATE",
    "CHANGED_DATE"
  ],
  fieldsToRemove: ["ORIGIN_PRODUCT_ID_DISPLAY", "STEP_TYPE_ID_DISPLAY"],
  
  // Foreign key lookups
  foreignKeys: {
    ORIGIN_PRODUCT_ID: {
      table: 'ORIGIN_PRODUCT',
      valueField: 'ORIGIN_PRODUCT_ID',
      displayField: 'PRODUCT_ID'
    },
    STEP_TYPE_ID: {
      table: 'STEP_TYPE',
      valueField: 'STEP_TYPE_ID',
      displayField: 'STEP_TYPE_NAME'
    }
  },
  
  // Auto-create missing foreign key records
  autoCreateForeignKeys: {
    ORIGIN_PRODUCT_ID: {
      entity: 'ORIGIN_PRODUCT',
      matchFields: ['PRODUCT_ID'],
      copyFields: ['PRODUCT_ID', 'VENDOR_NAME', 'PRODUCT_DESC', 'PSCU_CLIENT_ID', 'PARTNER_CODE']
    },
    STEP_TYPE_ID: {
      entity: 'STEP_TYPE', 
      matchFields: ['STEP_TYPE_NAME'],
      copyFields: ['STEP_TYPE_NAME', 'STEP_TYPE_DESC', 'RESOURCE_NAME']
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
    STEP_TYPE_ID: {
      lookupTable: 'STEP_TYPE',
      foreignKey: 'STEP_TYPE_ID',
      displayField: 'STEP_TYPE_NAME',
      displayFormat: '{STEP_TYPE_ID}: {STEP_TYPE_NAME}'
    }
  },
  
  // Form fields configuration
  formFields: [
    {
      "name": "ORIGIN_PRODUCT_ID",
      "type": "select",
      "required": true,
      "disabled": false,
      "options": []
    },
    {
      "name": "STEP_TYPE_ID",
      "type": "select",
      "required": true,
      "disabled": false,
      "options": []
    },
    {
      "name": "CRITERIA",
      "type": "text",
      "required": true,
      "disabled": false
    },
    {
      "name": "SEQUENCE_NBR",
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