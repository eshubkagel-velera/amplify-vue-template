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
  const templatePath = path.join(templatesDir, `Mutation.update${tableName}.request.vtl`);
  if (!fs.existsSync(templatePath)) return null;
  
  const content = fs.readFileSync(templatePath, 'utf8');
  const match = content.match(/variableMap.*?\{(.*?)\}/s);
  if (!match) return null;
  
  const fields = [];
  const lines = match[1].split('\n');
  for (const line of lines) {
    const fieldMatch = line.match(/":([^"]+)":/);
    if (fieldMatch && fieldMatch[1] !== `${tableName}_ID`) {
      fields.push(fieldMatch[1]);
    }
  }
  return fields;
}

// Fix each table's UPDATE template
tableConfigs.forEach(tableName => {
  const templatePath = path.join(templatesDir, `Mutation.update${tableName}.request.vtl`);
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
  const allFields = [pk, ...fields].join(', ');
  const setClause = fields.map(f => `${f} = COALESCE(:${f}, ${f})`).join(', ');
  
  // Build variable map
  const variableMap = [
    `    ":${pk}": $util.toJson($ctx.args.input.${pk})`,
    ...fields.map(field => `    ":${field}": $util.toJson($util.defaultIfNull($ctx.args.input.${field}, null))`)
  ].join(',\n');
  
  const template = `#set($update = "UPDATE ${tableName} SET ${setClause} WHERE ${pk} = :${pk}")
#set($select = "SELECT ${allFields} FROM ${tableName} WHERE ${pk} = :${pk}")
{
  "version": "2018-05-29",
  "statements": [
    "$util.escapeJavaScript($update)",
    "$util.escapeJavaScript($select)"
  ],
  "variableMap": {
${variableMap}
  }
}`;
  
  fs.writeFileSync(templatePath, template);
  console.log(`Fixed ${tableName} UPDATE template`);
});

console.log('All UPDATE VTL templates fixed!');