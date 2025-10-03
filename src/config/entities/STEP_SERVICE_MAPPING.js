export default {
  name: 'STEP_SERVICE_MAPPING',
  idField: 'STEP_SERVICE_MAPPING_ID',
  
  // Data loading configuration
  loadStepServiceMapping: true,
  
  // Filtering configuration
  hasFilters: true,
  filterType: 'stepType',
  enhanceWithDisplayFields: true, // Add STEP_TYPE and SERVICE display fields
  
  // Special form processing
  customFormProcessing: true // Use custom form data cleaning
};