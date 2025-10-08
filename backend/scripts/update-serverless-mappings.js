#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function updateServerlessMappings() {
  const templatesDir = path.join(__dirname, '../mapping-templates');
  const serverlessPath = path.join(__dirname, '../serverless.yml');
  const tableConfigPath = path.join(__dirname, '../dml_scripts/table_config.json');
  
  if (!fs.existsSync(templatesDir)) {
    console.error('Mapping templates directory not found');
    return;
  }
  
  // Load table configuration
  const tableConfig = JSON.parse(fs.readFileSync(tableConfigPath, 'utf8'));
  
  // Get all VTL template files
  const templateFiles = fs.readdirSync(templatesDir)
    .filter(file => file.endsWith('.vtl'))
    .sort();
  
  // Group templates by operation
  const mappings = [];
  const processedOperations = new Set();
  
  templateFiles.forEach(file => {
    const parts = file.split('.');
    if (parts.length !== 4) return; // Should be Type.operation.request/response.vtl
    
    const [type, operation, requestResponse, ext] = parts;
    const operationKey = `${type}.${operation}`;
    
    if (processedOperations.has(operationKey)) return;
    processedOperations.add(operationKey);
    
    // Check if both request and response templates exist
    const requestFile = `${type}.${operation}.request.vtl`;
    const responseFile = `${type}.${operation}.response.vtl`;
    
    if (templateFiles.includes(requestFile) && templateFiles.includes(responseFile)) {
      // Check if this operation is allowed in table config
      const tableName = operation.replace(/^(create|update|delete|list)/, '').replace(/S$/, '');
      const tablePerms = tableConfig.tables[tableName];
      
      if (tablePerms && tablePerms.includeInGraphQL) {
        let operationAllowed = false;
        
        if (operation.startsWith('list') && tablePerms.allowQuery) operationAllowed = true;
        else if (operation.startsWith('create') && tablePerms.allowCreate) operationAllowed = true;
        else if (operation.startsWith('update') && tablePerms.allowUpdate) operationAllowed = true;
        else if (operation.startsWith('delete') && tablePerms.allowDelete) operationAllowed = true;
        
        if (operationAllowed) {
          mappings.push(`      - dataSource: StageDataSource
        type: ${type}
        field: ${operation}
        request: ${requestFile}
        response: ${responseFile}`);
        }
      }
    }
  });
  
  // Read current serverless.yml as text
  let serverlessContent = fs.readFileSync(serverlessPath, 'utf8');
  
  // Find the mappingTemplates section and replace it
  const mappingTemplatesStart = serverlessContent.indexOf('    mappingTemplates:');
  if (mappingTemplatesStart === -1) {
    console.error('mappingTemplates section not found in serverless.yml');
    return;
  }
  
  // Find the end of mappingTemplates section (next top-level key or plugins section)
  const afterMappingTemplates = serverlessContent.indexOf('\nplugins:', mappingTemplatesStart);
  if (afterMappingTemplates === -1) {
    console.error('Could not find end of mappingTemplates section');
    return;
  }
  
  // Replace the mappingTemplates section
  const newMappingTemplates = `    mappingTemplates:\n${mappings.join('\n')}\n`;
  const updatedContent = serverlessContent.substring(0, mappingTemplatesStart) + 
                        newMappingTemplates + 
                        serverlessContent.substring(afterMappingTemplates);
  
  fs.writeFileSync(serverlessPath, updatedContent);
  
  console.log(`✅ Updated serverless.yml with ${mappings.length} mapping templates`);
}

if (require.main === module) {
  updateServerlessMappings();
}

module.exports = { updateServerlessMappings };