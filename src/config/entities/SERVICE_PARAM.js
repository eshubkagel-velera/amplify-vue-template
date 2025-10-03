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
  
  // Form field enhancements
  formFieldEnhancements: {
    SERVICE_ID: {
      disableWhenFiltered: true // Disable when service filter is active
    }
  }
};