export default {
  name: 'SERVICE',
  idField: 'SERVICE_ID',
  
  // Data loading configuration
  loadServiceProviders: true,
  
  // Row actions
  rowActions: [
    {
      name: 'parameters',
      label: 'Parameters',
      event: 'openServiceParams',
      class: 'btn-primary'
    },
    {
      name: 'stepMappings',
      label: 'Step Mappings', 
      event: 'openServiceStepMapping',
      class: 'btn-primary'
    }
  ]
};