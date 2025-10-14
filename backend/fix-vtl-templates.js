#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Table configurations with their fields
const tableConfigs = {
  'CONFIG_PARAM': {
    pk: 'CONFIG_PARAM_ID',
    fields: ['CONFIG_NAME', 'CONFIG_VALUE', 'DESCRIPTION', 'CREATED_DATE', 'CHANGED_DATE'],
    required: ['CONFIG_NAME', 'CONFIG_VALUE']
  },
  'FILTER_CRITERIA': {
    pk: 'FILTER_CRITERIA_ID',
    fields: ['ORIGIN_PRODUCT_ID', 'STEP_TYPE_ID', 'CRITERIA', 'SEQUENCE_NBR'],
    required: ['ORIGIN_PRODUCT_ID', 'STEP_TYPE_ID', 'CRITERIA', 'SEQUENCE_NBR']
  },
  'ORIGIN_PRODUCT': {
    pk: 'ORIGIN_PRODUCT_ID',
    fields: ['VENDOR_NAME', 'PRODUCT_ID', 'PSCU_CLIENT_ID', 'PRODUCT_DESC', 'CREATED_BY_USER_ID', 'CREATED_DATE', 'CHANGED_BY_USER_ID', 'CHANGED_DATE'],
    required: ['VENDOR_NAME', 'PRODUCT_ID', 'PSCU_CLIENT_ID', 'PRODUCT_DESC', 'CREATED_BY_USER_ID', 'CREATED_DATE']
  },
  'REDIRECT_URL': {
    pk: 'REDIRECT_URL_ID',
    fields: ['ORIGIN_PRODUCT_ID', 'URL_TYPE_CODE', 'URL', 'RESPONSE_TEXT', 'CREATED_BY_USER_ID', 'CREATED_DATE', 'CHANGED_BY_USER_ID', 'CHANGED_DATE'],
    required: ['URL_TYPE_CODE', 'URL', 'CREATED_BY_USER_ID', 'CREATED_DATE']
  },
  'SERVICE': {
    pk: 'SERVICE_ID',
    fields: ['SERVICE_PROVIDER_ID', 'URI', 'SECRET_NAME', 'REQUEST_TYPE', 'CREATED_BY_USER_ID', 'CREATED_DATE', 'CHANGED_BY_USER_ID', 'CHANGED_DATE'],
    required: ['SERVICE_PROVIDER_ID', 'URI', 'CREATED_BY_USER_ID', 'CREATED_DATE']
  },
  'SERVICE_DOMAIN': {
    pk: 'SERVICE_DOMAIN_ID',
    fields: ['SERVICE_PROVIDER_ID', 'DOMAIN_URL'],
    required: ['SERVICE_PROVIDER_ID', 'DOMAIN_URL']
  },
  'SERVICE_EXPR_MAPPING': {
    pk: 'SERVICE_EXPR_MAPPING_ID',
    fields: ['SERVICE_PARAM_MAPPING_ID', 'SOURCE_EXPR', 'TARGET_EXPR', 'CREATED_BY_USER_ID', 'CREATED_DATE', 'CHANGED_BY_USER_ID', 'CHANGED_DATE'],
    required: ['SERVICE_PARAM_MAPPING_ID', 'SOURCE_EXPR', 'TARGET_EXPR', 'CREATED_BY_USER_ID', 'CREATED_DATE']
  },
  'SERVICE_PARAM': {
    pk: 'SERVICE_PARAM_ID',
    fields: ['SERVICE_ID', 'PARAM_NAME', 'CREATED_BY_USER_ID', 'CREATED_DATE', 'CHANGED_BY_USER_ID', 'CHANGED_DATE'],
    required: ['SERVICE_ID', 'PARAM_NAME', 'CREATED_BY_USER_ID', 'CREATED_DATE']
  },
  'SERVICE_PARAM_MAPPING': {
    pk: 'SERVICE_PARAM_MAPPING_ID',
    fields: ['ORIGIN_PRODUCT_ID', 'SOURCE_SERVICE_PARAM_ID', 'TARGET_SERVICE_PARAM_ID', 'CREATED_BY_USER_ID', 'CREATED_DATE', 'CHANGED_BY_USER_ID', 'CHANGED_DATE'],
    required: ['ORIGIN_PRODUCT_ID', 'SOURCE_SERVICE_PARAM_ID', 'TARGET_SERVICE_PARAM_ID', 'CREATED_BY_USER_ID', 'CREATED_DATE']
  },
  'SERVICE_PROVIDER': {
    pk: 'SERVICE_PROVIDER_ID',
    fields: ['SERVICE_PROVIDER_NAME', 'CREATED_BY_USER_ID', 'CREATED_DATE', 'CHANGED_BY_USER_ID', 'CHANGED_DATE'],
    required: ['SERVICE_PROVIDER_NAME', 'CREATED_BY_USER_ID', 'CREATED_DATE']
  },
  'SORT_CRITERIA': {
    pk: 'SORT_CRITERIA_ID',
    fields: ['ORIGIN_PRODUCT_ID', 'STEP_TYPE_ID', 'JSON_PATH', 'SORT_ORDER', 'SORT_PRIORITY', 'SEQUENCE_NBR'],
    required: ['ORIGIN_PRODUCT_ID', 'STEP_TYPE_ID', 'JSON_PATH', 'SORT_ORDER', 'SORT_PRIORITY', 'SEQUENCE_NBR']
  },
  'STEP_SERVICE_MAPPING': {
    pk: 'STEP_SERVICE_MAPPING_ID',
    fields: ['STEP_TYPE_ID', 'SERVICE_ID', 'SEQUENCE_NBR'],
    required: ['STEP_TYPE_ID', 'SERVICE_ID', 'SEQUENCE_NBR']
  },
  'STEP_TYPE': {
    pk: 'STEP_TYPE_ID',
    fields: ['STEP_TYPE_NAME', 'STEP_TYPE_DESC', 'RESOURCE_NAME', 'CREATED_BY_USER_ID', 'CREATED_DATE', 'CHANGED_BY_USER_ID', 'CHANGED_DATE'],
    required: ['STEP_TYPE_NAME', 'STEP_TYPE_DESC', 'RESOURCE_NAME', 'CREATED_BY_USER_ID', 'CREATED_DATE']
  },
  'STEP_TYPE_PARAM_MAP': {
    pk: 'STEP_TYPE_PARAM_MAP_ID',
    fields: ['STEP_TYPE_ID', 'SERVICE_PARAM_MAPPING_ID', 'CREATED_BY_USER_ID'],
    required: ['STEP_TYPE_ID', 'SERVICE_PARAM_MAPPING_ID', 'CREATED_BY_USER_ID']
  }
};

function generateCreateRequest(tableName, config) {
  const fieldsList = config.fields.join(', ');
  const paramsList = config.fields.map(f => `:${f}`).join(', ');
  const allFields = [config.pk, ...config.fields].join(', ');
  
  return `#set($insert = "
  INSERT INTO ${tableName}
    (${fieldsList})
  VALUES
    (${paramsList})
")
#set($select = "
  SELECT
    ${allFields}
  FROM ${tableName}
  WHERE ${config.pk} = LAST_INSERT_ID()
")
{
  "version": "2018-05-29",
  "statements": [
    "$util.escapeJavaScript($insert)",
    "$util.escapeJavaScript($select)"
  ],
  "variableMap": {
${config.fields.map(field => `    ":${field}": $util.toJson($util.defaultIfNull($ctx.args.input.${field}, null))`).join(',\n')}
  }
}`;
}

function generateUpdateRequest(tableName, config) {
  const setClause = config.fields.map(f => `    ${f} = COALESCE(:${f}, ${f})`).join(',\n');
  const allFields = [config.pk, ...config.fields].join(', ');
  
  return `#set($update = "
  UPDATE ${tableName}
  SET
${setClause}
  WHERE ${config.pk} = :${config.pk}
")
#set($select = "
  SELECT
    ${allFields}
  FROM ${tableName}
  WHERE ${config.pk} = :${config.pk}
")
{
  "version": "2018-05-29",
  "statements": [
    "$util.escapeJavaScript($update)",
    "$util.escapeJavaScript($select)"
  ],
  "variableMap": {
    ":${config.pk}": $util.toJson($ctx.args.input.${config.pk}),
${config.fields.map(field => `    ":${field}": $util.toJson($util.defaultIfNull($ctx.args.input.${field}, null))`).join(',\n')}
  },
  "variableTypeHintMap": {
    ":${config.pk}": "INTEGER"
  }
}`;
}

function generateDeleteRequest(tableName, config) {
  const allFields = [config.pk, ...config.fields].join(', ');
  
  return `#set($preimage = "
  SELECT
    ${allFields}
  FROM ${tableName}
  WHERE ${config.pk} = :${config.pk}
  LIMIT 1
")
#set($delete = "
  DELETE FROM ${tableName}
  WHERE ${config.pk} = :${config.pk}
")
{
  "version": "2018-05-29",
  "statements": [
    "$util.escapeJavaScript($preimage)",
    "$util.escapeJavaScript($delete)"
  ],
  "variableMap": {
    ":${config.pk}": $util.toJson($ctx.args.input.${config.pk})
  },
  "variableTypeHintMap": {
    ":${config.pk}": "INTEGER"
  }
}`;
}

const mutationResponse = `#if ($ctx.error)
  $util.error($ctx.error.message, $ctx.error.type)
#end

#set($rows = $util.rds.toJsonObject($ctx.result))
#if ($rows.size() < 2 || $rows[1].size() == 0)
  $util.error("Operation succeeded but no row was returned by SELECT.", "NotFound")
#end

$util.toJson($rows[1][0])`;

const deleteResponse = `#if ($ctx.error)
  $util.error($ctx.error.message, $ctx.error.type)
#end

#set($rows = $util.rds.toJsonObject($ctx.result))
#if ($rows[0].size() == 0)
  $util.error("Nothing to delete.", "NotFound")
#end

$util.toJson($rows[0][0])`;

const templatesDir = path.join(__dirname, 'mapping-templates');

// Update all VTL templates
Object.entries(tableConfigs).forEach(([tableName, config]) => {
  // Create request
  const createRequestPath = path.join(templatesDir, `Mutation.create${tableName}.request.vtl`);
  if (fs.existsSync(createRequestPath)) {
    fs.writeFileSync(createRequestPath, generateCreateRequest(tableName, config));
    console.log(`Updated ${createRequestPath}`);
  }
  
  // Create response
  const createResponsePath = path.join(templatesDir, `Mutation.create${tableName}.response.vtl`);
  if (fs.existsSync(createResponsePath)) {
    fs.writeFileSync(createResponsePath, mutationResponse);
    console.log(`Updated ${createResponsePath}`);
  }
  
  // Update request
  const updateRequestPath = path.join(templatesDir, `Mutation.update${tableName}.request.vtl`);
  if (fs.existsSync(updateRequestPath)) {
    fs.writeFileSync(updateRequestPath, generateUpdateRequest(tableName, config));
    console.log(`Updated ${updateRequestPath}`);
  }
  
  // Update response
  const updateResponsePath = path.join(templatesDir, `Mutation.update${tableName}.response.vtl`);
  if (fs.existsSync(updateResponsePath)) {
    fs.writeFileSync(updateResponsePath, mutationResponse);
    console.log(`Updated ${updateResponsePath}`);
  }
  
  // Delete request
  const deleteRequestPath = path.join(templatesDir, `Mutation.delete${tableName}.request.vtl`);
  if (fs.existsSync(deleteRequestPath)) {
    fs.writeFileSync(deleteRequestPath, generateDeleteRequest(tableName, config));
    console.log(`Updated ${deleteRequestPath}`);
  }
  
  // Delete response
  const deleteResponsePath = path.join(templatesDir, `Mutation.delete${tableName}.response.vtl`);
  if (fs.existsSync(deleteResponsePath)) {
    fs.writeFileSync(deleteResponsePath, deleteResponse);
    console.log(`Updated ${deleteResponsePath}`);
  }
});

console.log('All VTL templates updated with correct MySQL patterns!');