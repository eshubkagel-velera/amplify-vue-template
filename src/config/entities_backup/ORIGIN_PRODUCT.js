export default {
  name: 'ORIGIN_PRODUCT',
  idField: 'ORIGIN_PRODUCT_ID',
  
  // Data loading configuration
  loadVendorNames: true,
  
  // Form field enhancements
  formFieldEnhancements: {
    VENDOR_NAME: {
      type: 'autocomplete',
      useDatalist: true
    }
  },
  
  // Row actions
  rowActions: [
    {
      name: 'mapping',
      label: 'Mapping',
      event: 'openMapping',
      class: 'btn-primary'
    },
    {
      name: 'redirectUrls',
      label: 'Redirect URLs',
      event: 'openRedirectUrls', 
      class: 'btn-primary'
    }
  ],
  
  // Form processing configuration
  keepAuditFieldsOnUpdate: true,
  
  // Environment copy configuration
  preserveOnCopy: ['ORIGIN_PRODUCT_ID'],
  
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
    }
  ],
  
  // Row actions configuration
  hasRowActions: true,
  rowActions: ['mapping', 'redirectUrls'],
  
  // Form processing configuration
  keepAuditFieldsOnUpdate: true,
  rowActions: ['mapping', 'redirectUrls'],
  
  // Environment comparison configuration
  comparisonConfig: {
    matchingFields: ['PRODUCT_ID']
  }
};