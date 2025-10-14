#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Table configurations with their unique fields for SELECT
const tableConfigs = {
  'SERVICE_PROVIDER': {
    uniqueFields: ['SERVICE_PROVIDER_NAME'],
    requiredFields: ['SERVICE_PROVIDER_NAME', 'CREATED_BY_USER_ID']
  },
  'STEP_TYPE': {
    uniqueFields: ['STEP_TYPE_NAME'],
    requiredFields: ['STEP_TYPE_NAME', 'STEP_TYPE_DESC', 'RESOURCE_NAME', 'CREATED_BY_USER_ID']
  },
  'SERVICE': {
    uniqueFields: ['SERVICE_PROVIDER_ID', 'URI'],
    requiredFields: ['SERVICE_PROVIDER_ID', 'URI', 'CREATED_BY_USER_ID']
  },
  'REDIRECT_URL': {
    uniqueFields: ['URL_TYPE_CODE', 'URL'],
    requiredFields: ['URL_TYPE_CODE', 'URL', 'CREATED_BY_USER_ID']
  },
  'SERVICE_DOMAIN': {
    uniqueFields: ['SERVICE_PROVIDER_ID', 'DOMAIN_URL'],
    requiredFields: ['SERVICE_PROVIDER_ID', 'DOMAIN_URL']
  },
  'SERVICE_PARAM': {
    uniqueFields: ['SERVICE_ID', 'PARAM_NAME'],
    requiredFields: ['SERVICE_ID', 'PARAM_NAME', 'CREATED_BY_USER_ID']
  },
  'FILTER_CRITERIA': {
    uniqueFields: ['ORIGIN_PRODUCT_ID', 'STEP_TYPE_ID', 'CRITERIA'],
    requiredFields: ['ORIGIN_PRODUCT_ID', 'STEP_TYPE_ID', 'CRITERIA', 'SEQUENCE_NBR']
  },
  'SORT_CRITERIA': {
    uniqueFields: ['ORIGIN_PRODUCT_ID', 'STEP_TYPE_ID', 'JSON_PATH'],
    requiredFields: ['ORIGIN_PRODUCT_ID', 'STEP_TYPE_ID', 'JSON_PATH', 'SORT_ORDER', 'SORT_PRIORITY', 'SEQUENCE_NBR']
  },
  'SERVICE_PARAM_MAPPING': {
    uniqueFields: ['ORIGIN_PRODUCT_ID', 'SOURCE_SERVICE_PARAM_ID', 'TARGET_SERVICE_PARAM_ID'],
    requiredFields: ['ORIGIN_PRODUCT_ID', 'SOURCE_SERVICE_PARAM_ID', 'TARGET_SERVICE_PARAM_ID', 'CREATED_BY_USER_ID']
  },
  'STEP_SERVICE_MAPPING': {
    uniqueFields: ['STEP_TYPE_ID', 'SERVICE_ID'],
    requiredFields: ['STEP_TYPE_ID', 'SERVICE_ID', 'SEQUENCE_NBR']
  },
  'SERVICE_EXPR_MAPPING': {
    uniqueFields: ['SERVICE_PARAM_MAPPING_ID', 'SOURCE_EXPR', 'TARGET_EXPR'],
    requiredFields: ['SERVICE_PARAM_MAPPING_ID', 'SOURCE_EXPR', 'TARGET_EXPR', 'CREATED_BY_USER_ID']
  },
  'STEP_TYPE_PARAM_MAP': {
    uniqueFields: ['STEP_TYPE_ID', 'SERVICE_PARAM_MAPPING_ID'],
    requiredFields: ['STEP_TYPE_ID', 'SERVICE_PARAM_MAPPING_ID', 'CREATED_BY_USER_ID']
  }
};

const templatesDir = path.join(__dirname, 'mapping-templates');

// Read existing template to get field list
function getFieldsFromTemplate(tableName) {
  const templatePath = path.join(templatesDir, `Mutation.create${tableName}.request.vtl`);
  if (!fs.existsSync(templatePath)) return null;
  
  const content = fs.readFileSync(templatePath, 'utf8');
  const match = content.match(/variableMap.*?\{(.*?)\}/s);
  if (!match) return null;
  
  const fields = [];
  const lines = match[1].split('\n');
  for (const line of lines) {
    const fieldMatch = line.match(/":([^"]+)":/);
    if (fieldMatch) {
      fields.push(fieldMatch[1]);
    }
  }
  return fields;
}

// Fix each table's CREATE template
Object.entries(tableConfigs).forEach(([tableName, config]) => {
  const templatePath = path.join(templatesDir, `Mutation.create${tableName}.request.vtl`);
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
  const fieldsList = fields.join(', ');
  const paramsList = fields.map(f => f === 'CREATED_DATE' ? 'COALESCE(:CREATED_DATE, NOW())' : `:${f}`).join(', ');
  
  // Build WHERE clause for unique fields
  const whereClause = config.uniqueFields.map(f => `${f} = :${f}`).join(' AND ');
  
  // Build variable map
  const variableMap = fields.map(field => {
    const isRequired = config.requiredFields.includes(field);
    if (isRequired) {
      return `    ":${field}": $util.toJson($ctx.args.input.${field})`;
    } else {
      return `    ":${field}": $util.toJson($util.defaultIfNull($ctx.args.input.${field}, null))`;
    }
  }).join(',\n');
  
  const template = `#set($insert = "INSERT INTO ${tableName} (${fieldsList}) VALUES (${paramsList})")
#set($select = "SELECT ${allFields} FROM ${tableName} WHERE ${whereClause} ORDER BY ${pk} DESC LIMIT 1")
{
  "version": "2018-05-29",
  "statements": [
    "$util.escapeJavaScript($insert)",
    "$util.escapeJavaScript($select)"
  ],
  "variableMap": {
${variableMap}
  }
}`;
  
  fs.writeFileSync(templatePath, template);
  console.log(`Fixed ${tableName} CREATE template`);
});

console.log('All CREATE VTL templates fixed!');