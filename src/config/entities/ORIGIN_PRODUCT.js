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
  ]
};