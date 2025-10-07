export default {
  name: 'REDIRECT_URL',
  idField: 'REDIRECT_URL_ID',
  
  // Data loading configuration
  loadProductOptions: true,
  
  // Filtering configuration
  hasFilters: true,
  filterType: 'product',
  autoFillFromFilter: {
    filterField: 'selectedProductFilter',
    formField: 'ORIGIN_PRODUCT_ID'
  },
  
  // Form processing configuration
  fieldsToRemove: ['PRODUCT_ID'],
  keepAuditFieldsOnUpdate: false,
  
  // Environment copy configuration
  preserveOnCopy: ['REDIRECT_URL_ID', 'ORIGIN_PRODUCT_ID'],
  
  // Environment comparison configuration
  comparisonConfig: {
    matchingFields: ['PRODUCT_ID']
  },
  
  // Fields configuration
  fields: ['REDIRECT_URL_ID', 'PRODUCT_ID', 'URL_TYPE_CODE', 'URL', 'RESPONSE_TEXT', 'CREATED_BY_USER_ID', 'CREATED_DATE', 'CHANGED_BY_USER_ID', 'CHANGED_DATE'],
  
  // Form fields configuration
  formFields: [
    { name: 'ORIGIN_PRODUCT_ID', type: 'select', required: true, disabled: false, options: [] },
    { name: 'URL_TYPE_CODE', type: 'select', required: true, disabled: false, options: [
      { value: 'N', label: 'New' },
      { value: 'E', label: 'Existing' }
    ] },
    { name: 'URL', type: 'text', required: true, disabled: false },
    { name: 'RESPONSE_TEXT', type: 'text', required: false, disabled: false },
    { name: 'CREATED_BY_USER_ID', type: 'number', required: true, disabled: false },
    { name: 'CREATED_DATE', type: 'date', required: true, disabled: true }
  ],
  
  // Filter configuration
  hasFilters: true,
  filterType: 'product',
  autoFillFromFilter: { filterField: 'selectedProductFilter', formField: 'ORIGIN_PRODUCT_ID' }
};