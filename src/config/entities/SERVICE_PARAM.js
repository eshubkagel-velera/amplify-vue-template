export default {
  name: 'SERVICE_PARAM',
  idField: 'SERVICE_PARAM_ID',
  
  // Data loading configuration
  loadServiceOptions: true,
  enhanceWithServiceDisplay: true,
  checkParameterMappings: true,
  
  // Filtering configuration
  hasFilters: true,
  filterType: 'service',
  autoFillFromFilter: {
    filterField: 'selectedServiceFilter',
    formField: 'SERVICE_ID'
  },
  
  // Special behaviors
  requiresServiceFilter: true, // Don't show data without service filter
  copyOnEditWithMappings: true, // Create copy instead of edit if mappings exist
  mappingCheckFunction: 'checkParameterMappings', // Function name to check for mappings
  
  // Form field enhancements
  formFieldEnhancements: {
    SERVICE_ID: {
      disableWhenFiltered: true // Disable when service filter is active
    }
  },
  
  // Form processing configuration
  keepAuditFieldsOnUpdate: false,
  fieldsToRemove: ['SERVICE_DISPLAY', 'Service Provider'],
  
  // Environment copy configuration
  preserveOnCopy: ['SERVICE_PARAM_ID', 'SERVICE_ID'],
  
  // Environment comparison configuration
  comparisonConfig: {
    matchingFields: ['PARAM_NAME'],
    stringMatchFields: ['PARAM_NAME'],
    stringMatchThreshold: 0.75,
    comparisonFields: ['PARAM_NAME']
  },
  
  // Fields configuration
  fields: ['SERVICE_PARAM_ID', 'SERVICE_ID', 'PARAM_NAME', 'CREATED_BY_USER_ID', 'CREATED_DATE', 'CHANGED_BY_USER_ID', 'CHANGED_DATE'],
  
  // Comparison fields (what to show in comparison mode)
  comparisonFields: ['SERVICE_PARAM_ID', 'SERVICE_DISPLAY', 'PARAM_NAME', 'CREATED_BY_USER_ID', 'CREATED_DATE', 'CHANGED_BY_USER_ID', 'CHANGED_DATE'],
  
  // Form fields configuration
  formFields: [
    { name: 'SERVICE_ID', type: 'select', required: true, disabled: false, options: [] },
    { name: 'PARAM_NAME', type: 'text', required: true, disabled: false },
    { name: 'CREATED_BY_USER_ID', type: 'number', required: true, disabled: false },
    { name: 'CREATED_DATE', type: 'date', required: true, disabled: true }
  ],
  
  // Filter configuration
  hasFilters: true,
  filterType: 'service',
  autoFillFromFilter: { filterField: 'selectedServiceFilter', formField: 'SERVICE_ID' }
};