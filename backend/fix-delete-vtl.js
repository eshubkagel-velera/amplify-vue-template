#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Table configurations
const tableConfigs = [
  'CONFIG_PARAM', 'FILTER_CRITERIA', 'ORIGIN_PRODUCT', 'REDIRECT_URL', 'SERVICE',
  'SERVICE_DOMAIN', 'SERVICE_EXPR_MAPPING', 'SERVICE_PARAM', 'SERVICE_PARAM_MAPPING',
  'SERVICE_PROVIDER', 'SORT_CRITERIA', 'STEP_SERVICE_MAPPING', 'STEP_TYPE', 'STEP_TYPE_PARAM_MAP'
];

const templatesDir = path.join(__dirname, 'mapping-templates');

// Read existing template to get field list
function getFieldsFromTemplate(tableName) {
  const templatePath = path.join(templatesDir, `Mutation.delete${tableName}.request.vtl`);
  if (!fs.existsSync(templatePath)) return null;
  
  const content = fs.readFileSync(templatePath, 'utf8');
  const match = content.match(/SELECT\s+(.*?)\s+FROM/s);
  if (!match) return null;
  
  return match[1].split(',').map(f => f.trim());
}

// Fix each table's DELETE template
tableConfigs.forEach(tableName => {
  const templatePath = path.join(templatesDir, `Mutation.delete${tableName}.request.vtl`);
  if (!fs.existsSync(templatePath)) {
    console.log(`Skipping ${tableName} - template not found`);
    return;
  }
  
  const fields = getFieldsFromTemplate(tableName);
  if (!fields) {
    console.log(`Skipping ${tableName} - could not parse fields`);
    return;
  }
  
  const pk = `${tableName}_ID`;
  const allFields = fields.join(', ');
  
  const template = `#set($preimage = "SELECT ${allFields} FROM ${tableName} WHERE ${pk} = :${pk} LIMIT 1")
#set($delete = "DELETE FROM ${tableName} WHERE ${pk} = :${pk}")
{
  "version": "2018-05-29",
  "statements": [
    "$util.escapeJavaScript($preimage)",
    "$util.escapeJavaScript($delete)"
  ],
  "variableMap": {
    ":${pk}": $util.toJson($ctx.args.input.${pk})
  }
}`;
  
  fs.writeFileSync(templatePath, template);
  console.log(`Fixed ${tableName} DELETE template`);
});

console.log('All DELETE VTL templates fixed!');