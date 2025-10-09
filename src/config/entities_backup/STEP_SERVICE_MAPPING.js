export default {
  name: 'STEP_SERVICE_MAPPING',
  idField: 'STEP_SERVICE_MAPPING_ID',
  
  // Data loading configuration
  loadStepServiceMapping: true,
  
  // Filtering configuration
  hasFilters: true,
  filterType: 'stepType',
  enhanceWithDisplayFields: true, // Add STEP_TYPE and SERVICE display fields
  autoFillFromFilter: {
    filterField: 'selectedStepTypeFilter',
    formField: 'STEP_TYPE_ID'
  },
  
  // Special form processing
  customFormProcessing: true, // Use custom form data cleaning
  
  // Form processing configuration
  fieldsToRemove: ['STEP_TYPE', 'SERVICE'],
  keepAuditFieldsOnUpdate: false,
  
  // Environment copy configuration
  preserveOnCopy: ['STEP_SERVICE_MAPPING_ID', 'STEP_TYPE_ID', 'SERVICE_ID'],
  
  // Environment comparison configuration
  comparisonConfig: {
    matchingFields: ['STEP_TYPE', 'SERVICE']
  },
  
  // Fields configuration
  fields: [
    "STEP_SERVICE_MAPPING_ID",
    "STEP_TYPE_ID",
    "SERVICE_ID",
    "SEQUENCE_NBR"
  ],
  
  // Form fields configuration
  formFields: [
    {
      "name": "STEP_TYPE_ID",
      "type": "number",
      "required": true,
      "disabled": false
    },
    {
      "name": "SERVICE_ID",
      "type": "number",
      "required": true,
      "disabled": false
    },
    {
      "name": "SEQUENCE_NBR",
      "type": "number",
      "required": false,
      "disabled": false
    }
  ] },
    { name: 'SERVICE_ID', type: 'select', required: true, disabled: false, options: [] },
    { name: 'SEQUENCE_NBR', type: 'number', required: false, disabled: false }
  ]
};