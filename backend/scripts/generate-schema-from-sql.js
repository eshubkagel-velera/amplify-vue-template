#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const tableConfigPath = path.join(__dirname, '../../config/table_config.json');
let tableConfig = JSON.parse(fs.readFileSync(tableConfigPath, 'utf8'));

function updateTableConfig(sqlFiles) {
  let configUpdated = false;
  
  // Add new tables from SQL files
  sqlFiles.forEach(file => {
    const tableName = file.replace('.sql', '');
    if (!tableConfig.tables[tableName]) {
      console.log(`📝 Adding new table to config: ${tableName}`);
      tableConfig.tables[tableName] = {
        includeInGraphQL: true,
        includeInApp: true,
        allowQuery: true,
        allowCreate: true,
        allowUpdate: true,
        allowDelete: true
      };
      configUpdated = true;
    }
  });
  
  // Remove tables that no longer have SQL files
  const existingTables = sqlFiles.map(file => file.replace('.sql', ''));
  Object.keys(tableConfig.tables).forEach(tableName => {
    if (!existingTables.includes(tableName)) {
      console.log(`🗑️ Removing table from config (no SQL file): ${tableName}`);
      delete tableConfig.tables[tableName];
      configUpdated = true;
    }
  });
  
  // Save updated config
  if (configUpdated) {
    fs.writeFileSync(tableConfigPath, JSON.stringify(tableConfig, null, 2));
    console.log('✅ Updated table_config.json');
  }
}

const sqlToGraphQLType = {
  'int': 'Int',
  'varchar': 'String',
  'char': 'String',
  'text': 'String',
  'timestamp': 'String',
  'date': 'String',
  'enum': 'String'
};

function parseCreateTableSQL(sql) {
  const createTableMatch = sql.match(/CREATE TABLE[^(]*`?(\w+)`?[^(]*\(([^;]+)\)/s);
  if (!createTableMatch) return null;
  
  const tableName = createTableMatch[1];
  const tableContent = createTableMatch[2];
  const columns = [];
  
  // Split by comma but handle parentheses
  const lines = [];
  let currentLine = '';
  let parenDepth = 0;
  
  for (let i = 0; i < tableContent.length; i++) {
    const char = tableContent[i];
    if (char === '(') parenDepth++;
    if (char === ')') parenDepth--;
    
    if (char === ',' && parenDepth === 0) {
      lines.push(currentLine.trim());
      currentLine = '';
    } else {
      currentLine += char;
    }
  }
  if (currentLine.trim()) lines.push(currentLine.trim());
  
  let primaryKey = '';
  
  lines.forEach(line => {
    const trimmed = line.trim();
    
    // Parse column definitions
    if (trimmed.startsWith('`')) {
      const colMatch = trimmed.match(/^`(\w+)`\s+(\w+(?:\([^)]*\))?)/);
      if (colMatch) {
        const [, colName, dataType] = colMatch;
        const isRequired = trimmed.includes('NOT NULL') && !trimmed.includes('AUTO_INCREMENT');
        const graphqlType = sqlToGraphQLType[dataType.toLowerCase().split('(')[0]] || 'String';
        
        columns.push({
          name: colName,
          type: graphqlType,
          required: isRequired
        });
      }
    }
    
    // Parse primary key
    if (trimmed.startsWith('PRIMARY KEY')) {
      const pkMatch = trimmed.match(/PRIMARY KEY\s*\(\s*`?(\w+)`?\s*\)/);
      if (pkMatch) {
        primaryKey = pkMatch[1];
      }
    }
  });
  
  return { tableName, columns, primaryKey };
}

function cleanupOldFiles() {
  const mappingTemplatesDir = path.join(__dirname, '../mapping-templates');
  const entityConfigDir = path.join(__dirname, '../../src/config/entities');
  
  // Get list of tables that should be included
  const includedTables = Object.entries(tableConfig.tables)
    .filter(([_, config]) => config.includeInGraphQL || config.includeInApp)
    .map(([tableName, _]) => tableName);
  
  console.log('Cleaning up old files...');
  
  // Clean mapping templates
  if (fs.existsSync(mappingTemplatesDir)) {
    const templateFiles = fs.readdirSync(mappingTemplatesDir);
    templateFiles.forEach(file => {
      let shouldRemove = false;
      let tableName = null;
      let operation = null;
      
      // Query.listTABLE_NAMES.request.vtl -> TABLE_NAME
      const queryMatch = file.match(/^Query\.list([A-Z_]+)S\.(request|response)\.vtl$/);
      if (queryMatch) {
        tableName = queryMatch[1];
        operation = 'query';
      }
      
      // Mutation.operationTABLE_NAME.request.vtl -> TABLE_NAME
      const mutationMatch = file.match(/^Mutation\.(create|update|delete)([A-Z_]+)\.(request|response)\.vtl$/);
      if (mutationMatch) {
        tableName = mutationMatch[2];
        operation = mutationMatch[1];
      }
      
      if (tableName) {
        const tablePerms = tableConfig.tables[tableName];
        
        // Remove if table not included in GraphQL
        if (!includedTables.includes(tableName)) {
          shouldRemove = true;
        }
        // Remove if operation not allowed
        else if (tablePerms) {
          if (operation === 'query' && !tablePerms.allowQuery) shouldRemove = true;
          else if (operation === 'create' && !tablePerms.allowCreate) shouldRemove = true;
          else if (operation === 'update' && !tablePerms.allowUpdate) shouldRemove = true;
          else if (operation === 'delete' && !tablePerms.allowDelete) shouldRemove = true;
        }
        
        if (shouldRemove) {
          fs.unlinkSync(path.join(mappingTemplatesDir, file));
          console.log(`🗑️ Removed mapping template: ${file} (operation not allowed)`);
        }
      }
    });
  }
  
  // Clean entity config files - only remove if table no longer exists in config
  if (fs.existsSync(entityConfigDir)) {
    const entityFiles = fs.readdirSync(entityConfigDir).filter(file => file.endsWith('.js'));
    entityFiles.forEach(file => {
      const tableName = file.replace('.js', '');
      // Only remove if table is not in config at all, or explicitly set to includeInApp: false
      if (!tableConfig.tables[tableName] || !tableConfig.tables[tableName].includeInApp) {
        fs.unlinkSync(path.join(entityConfigDir, file));
        console.log(`🗑️ Removed entity config: ${file}`);
      }
    });
  }
}

function generateSchemaFromSQL() {
  const scriptsDir = path.join(__dirname, '../dml_scripts/individual_tables');
  const files = fs.readdirSync(scriptsDir).filter(file => file.endsWith('.sql'));
  
  // Backup existing schema before regeneration
  const schemaPath = path.join(__dirname, '../schema.graphql');
  if (fs.existsSync(schemaPath)) {
    const backupPath = path.join(__dirname, '../schema.graphql.backup');
    fs.copyFileSync(schemaPath, backupPath);
    console.log('📋 Backed up existing schema.graphql');
  }
  
  // Update table config with new SQL files
  updateTableConfig(files);
  
  // Clean up old files first
  cleanupOldFiles();
  
  let schemaTypes = '';
  let schemaInputs = '';
  let schemaConnections = '';
  let schemaQueries = '';
  let schemaMutations = '';
  
  files.forEach(file => {
    const tableName = file.replace('.sql', '');
    
    // Skip if not included in GraphQL
    if (!tableConfig.tables[tableName]?.includeInGraphQL) return;
    
    const sql = fs.readFileSync(path.join(scriptsDir, file), 'utf8');
    const parsed = parseCreateTableSQL(sql);
    
    if (!parsed) return;
    
    console.log(`Processing ${tableName}...`);
    
    // Generate type
    schemaTypes += `\ntype ${tableName} {\n`;
    parsed.columns.forEach(col => {
      const required = col.required ? '!' : '';
      schemaTypes += `  ${col.name}: ${col.type}${required}\n`;
    });
    schemaTypes += '}\n';
    
    // Generate connection type
    schemaConnections += `\ntype ${tableName}Connection {\n  items: [${tableName}]\n  nextToken: String\n}\n`;
    
    // Generate input types - exclude auto-increment primary key from create
    const createFields = parsed.columns.filter(col => {
      // Exclude primary key if it's auto-increment
      if (col.name === parsed.primaryKey) {
        const sql = fs.readFileSync(path.join(scriptsDir, file), 'utf8');
        return !sql.includes('AUTO_INCREMENT');
      }
      return true;
    });
    const updateFields = parsed.columns.filter(col => col.name === parsed.primaryKey || col.name !== parsed.primaryKey);
    
    // Create input
    schemaInputs += `\ninput Create${tableName}Input {\n`;
    createFields.forEach(col => {
      const required = col.required ? '!' : '';
      schemaInputs += `  ${col.name}: ${col.type}${required}\n`;
    });
    schemaInputs += '}\n';
    
    // Update input
    schemaInputs += `\ninput Update${tableName}Input {\n`;
    updateFields.forEach(col => {
      const required = col.name === parsed.primaryKey ? '!' : '';
      schemaInputs += `  ${col.name}: ${col.type}${required}\n`;
    });
    schemaInputs += '}\n';
    
    // Delete input
    const pkType = parsed.columns.find(col => col.name === parsed.primaryKey)?.type || 'Int';
    schemaInputs += `\ninput Delete${tableName}Input {\n  ${parsed.primaryKey}: ${pkType}!\n}\n`;
    
    // Generate queries and mutations based on permissions
    const tablePerms = tableConfig.tables[tableName];
    
    if (tablePerms.allowQuery) {
      const pluralName = tableName.endsWith('S') ? tableName : `${tableName}S`;
      schemaQueries += `  list${pluralName}: ${tableName}Connection @aws_auth(cognito_groups: ["readonly", "developer", "deployment", "admin"])\n`;
    }
    
    if (tablePerms.allowCreate) {
      schemaMutations += `  create${tableName}(input: Create${tableName}Input!): ${tableName} @aws_auth(cognito_groups: ["developer", "deployment", "admin"])\n`;
    }
    if (tablePerms.allowUpdate) {
      schemaMutations += `  update${tableName}(input: Update${tableName}Input!): ${tableName} @aws_auth(cognito_groups: ["developer", "deployment", "admin"])\n`;
    }
    if (tablePerms.allowDelete) {
      schemaMutations += `  delete${tableName}(input: Delete${tableName}Input!): ${tableName} @aws_auth(cognito_groups: ["developer", "deployment", "admin"])\n`;
    }
  });
  
  // Generate complete schema
  const schema = `schema {
  query: Query
  mutation: Mutation
  subscription: Subscription
}
${schemaTypes}
${schemaInputs}
${schemaConnections}

type Query {
${schemaQueries}}

type Mutation {
${schemaMutations}}

type Subscription {
  onCreateCONFIG_PARAM: CONFIG_PARAM
  onCreateLOAN_APP: LOAN_APP
  onCreateNEW_MEMBER_TOKEN: NEW_MEMBER_TOKEN
  onCreateORIGIN_PRODUCT: ORIGIN_PRODUCT
}`;
  
  // Write schema file
  fs.writeFileSync(path.join(__dirname, '../schema.graphql'), schema);
  console.log('✅ Generated schema.graphql from SQL files');
  
  // Generate mapping templates
  generateMappingTemplates();
  
  // Update serverless.yml with new mappings
  const { updateServerlessMappings } = require('./update-serverless-mappings');
  updateServerlessMappings();
}

function generateMappingTemplates() {
  const scriptsDir = path.join(__dirname, '../dml_scripts/individual_tables');
  const templatesDir = path.join(__dirname, '../mapping-templates');
  const files = fs.readdirSync(scriptsDir).filter(file => file.endsWith('.sql'));
  
  // Ensure templates directory exists
  if (!fs.existsSync(templatesDir)) {
    fs.mkdirSync(templatesDir, { recursive: true });
  }
  
  files.forEach(file => {
    const tableName = file.replace('.sql', '');
    
    // Skip if not included in GraphQL
    if (!tableConfig.tables[tableName]?.includeInGraphQL) return;
    
    console.log(`Generating templates for ${tableName}...`);
    
    const tablePerms = tableConfig.tables[tableName];
    
    // Get primary key for this table (needed for all templates)
    const sql = fs.readFileSync(path.join(scriptsDir, file), 'utf8');
    const parsed = parseCreateTableSQL(sql);
    const primaryKey = parsed ? parsed.primaryKey : `${tableName}_ID`;
    
    // Query templates (only if allowed)
    if (tablePerms.allowQuery) {
      
      const listRequestTemplate = `{
  "version": "2018-05-29",
  "statements": [
    "SELECT * FROM ${tableName} ORDER BY ${primaryKey}#if($ctx.args.nextToken) OFFSET $ctx.args.nextToken#end#if($ctx.args.limit) LIMIT $ctx.args.limit#end"
  ]
}`;

      const listResponseTemplate = `## Raise a GraphQL field error in case of a datasource invocation error
#if($ctx.error)
    $utils.error($ctx.error.message, $ctx.error.type)
#end

#set($result = $utils.rds.toJsonObject($ctx.result)[0])
#set($items = $result)
#set($hasNextToken = false)
#if($ctx.args.limit && $items.size() == $ctx.args.limit)
  #set($hasNextToken = true)
  #set($nextTokenValue = $ctx.args.nextToken)
  #if(!$nextTokenValue)
    #set($nextTokenValue = 0)
  #end
  #set($nextTokenValue = $nextTokenValue + $ctx.args.limit)
#end
{
  "items": $util.toJson($items),
  #if($hasNextToken)"nextToken": "$nextTokenValue"#else"nextToken": null#end
}`;

      const pluralName = tableName.endsWith('S') ? tableName : `${tableName}S`;
      fs.writeFileSync(path.join(templatesDir, `Query.list${pluralName}.request.vtl`), listRequestTemplate);
      fs.writeFileSync(path.join(templatesDir, `Query.list${pluralName}.response.vtl`), listResponseTemplate);
    }

    // Generate column lists for templates
    const allColumns = parsed.columns.map(col => col.name);
    const createColumns = parsed.columns.filter(col => {
      // Always exclude AUTO_INCREMENT primary key from INSERT
      if (col.name === primaryKey && sql.includes('AUTO_INCREMENT')) {
        return false;
      }
      return true;
    });
    
    const columnsList = allColumns.join(', ');
    const createColumnsList = createColumns.map(col => col.name).join(', ');
    const createParamsList = createColumns.map(col => `:${col.name}`).join(', ');
    
    // Build variable maps with proper null handling
    const createVariableMap = createColumns.map(col => {
      const isRequired = col.required && !col.name.includes('CHANGED_') && !col.name.includes('CREATED_');
      if (isRequired) {
        return `    ":${col.name}": $util.toJson($ctx.args.input.${col.name})`;
      } else {
        return `    ":${col.name}": $util.toJson($util.defaultIfNull($ctx.args.input.${col.name}, null))`;
      }
    }).join(',\n');
    
    const updateVariableMap = allColumns.map(col => {
      if (col === primaryKey) {
        return `    ":${col}": $util.toJson($ctx.args.input.${col})`;
      } else {
        return `    ":${col}": $util.toJson($util.defaultIfNull($ctx.args.input.${col}, null))`;
      }
    }).join(',\n');
    
    const updateSetClause = allColumns.filter(col => col !== primaryKey).map(col => {
      if (col.includes('CHANGED_DATE')) {
        return `${col} = COALESCE(:${col}, NOW())`;
      } else {
        return `${col} = COALESCE(:${col}, ${col})`;
      }
    }).join(', ');
    
    // Find a unique field to use for lookup (prefer NAME fields, then first non-ID field)
    const uniqueField = parsed.columns.find(col => 
      col.name.includes('NAME') && !col.name.includes('_ID')
    ) || parsed.columns.find(col => 
      !col.name.includes('_ID') && col.name !== primaryKey
    ) || parsed.columns[1];
    
    // Special handling for tables without good unique fields
    let selectWhereClause;
    if (tableName === 'SERVICE') {
      selectWhereClause = `SERVICE_PROVIDER_ID = :SERVICE_PROVIDER_ID AND URI = :URI`;
    } else if (tableName === 'SERVICE_PARAM_MAPPING') {
      selectWhereClause = `ORIGIN_PRODUCT_ID = :ORIGIN_PRODUCT_ID AND SOURCE_SERVICE_PARAM_ID = :SOURCE_SERVICE_PARAM_ID AND TARGET_SERVICE_PARAM_ID = :TARGET_SERVICE_PARAM_ID`;
    } else if (tableName === 'STEP_TYPE_PARAM_MAP') {
      selectWhereClause = `STEP_TYPE_ID = :STEP_TYPE_ID AND SERVICE_PARAM_MAPPING_ID = :SERVICE_PARAM_MAPPING_ID`;
    } else {
      selectWhereClause = `${uniqueField.name} = :${uniqueField.name}`;
    }
    
    // Mutation templates using unique field lookup instead of LAST_INSERT_ID
    const createRequestTemplate = `#set($insert = "
  INSERT INTO ${tableName}
    (${createColumnsList})
  VALUES
    (${createParamsList.replace(/:([A-Z_]+)/g, (match, field) => {
      if (field.includes('CREATED_DATE')) return `COALESCE(:${field}, NOW())`;
      return `:${field}`;
    })})
")
#set($select = "
  SELECT
    ${columnsList}
  FROM ${tableName}
  WHERE ${selectWhereClause}
  ORDER BY ${primaryKey} DESC
  LIMIT 1
")
{
  "version": "2018-05-29",
  "statements": [
    "$util.escapeJavaScript($insert)",
    "$util.escapeJavaScript($select)"
  ],
  "variableMap": {
${createVariableMap}
  }
}`;

    const updateRequestTemplate = `#set($update = "
  UPDATE ${tableName}
  SET ${updateSetClause}
  WHERE ${primaryKey} = :${primaryKey}
")
#set($select = "
  SELECT ${columnsList}
  FROM ${tableName}
  WHERE ${primaryKey} = :${primaryKey}
")
{
  "version": "2018-05-29",
  "statements": [
    "$util.escapeJavaScript($update)",
    "$util.escapeJavaScript($select)"
  ],
  "variableMap": {
${updateVariableMap}
  }
}`;

    const deleteRequestTemplate = `#set($preimage = "
  SELECT ${columnsList}
  FROM ${tableName}
  WHERE ${primaryKey} = :${primaryKey}
  LIMIT 1
")
#set($delete = "
  DELETE FROM ${tableName}
  WHERE ${primaryKey} = :${primaryKey}
")
{
  "version": "2018-05-29",
  "statements": [
    "$util.escapeJavaScript($preimage)",
    "$util.escapeJavaScript($delete)"
  ],
  "variableMap": {
    ":${primaryKey}": $util.toJson($ctx.args.input.${primaryKey})
  }
}`;

    const createResponseTemplate = `#if($ctx.error)
  $util.error($ctx.error.message, $ctx.error.type)
#end
#set($rows = $util.rds.toJsonObject($ctx.result))
#if($rows.size() < 2 || $rows[1].size() == 0)
  $util.error("Create succeeded but no row was returned by SELECT.", "NotFound")
#end
$util.toJson($rows[1][0])`;

    const updateResponseTemplate = `#if($ctx.error)
  $util.error($ctx.error.message, $ctx.error.type)
#end

#set($rows = $util.rds.toJsonObject($ctx.result))
#if($rows.size() < 2 || $rows[1].size() == 0)
  $util.error("No row found for ${primaryKey}.", "NotFound")
#end

$util.toJson($rows[1][0])`;

    const deleteResponseTemplate = `#if($ctx.error)
  $util.error($ctx.error.message, $ctx.error.type)
#end

#set($rows = $util.rds.toJsonObject($ctx.result))
#if($rows[0].size() == 0)
  $util.error("Nothing to delete for ${primaryKey}.", "NotFound")
#end

$util.toJson($rows[0][0])`;

    const operations = [
      { name: 'create', allowed: tablePerms.allowCreate },
      { name: 'update', allowed: tablePerms.allowUpdate },
      { name: 'delete', allowed: tablePerms.allowDelete }
    ];
    
    operations.forEach(op => {
      if (op.allowed) {
        let requestTemplate, responseTemplate;
        if (op.name === 'create') {
          requestTemplate = createRequestTemplate;
          responseTemplate = createResponseTemplate;
        } else if (op.name === 'update') {
          requestTemplate = updateRequestTemplate;
          responseTemplate = updateResponseTemplate;
        } else if (op.name === 'delete') {
          requestTemplate = deleteRequestTemplate;
          responseTemplate = deleteResponseTemplate;
        }
        
        fs.writeFileSync(path.join(templatesDir, `Mutation.${op.name}${tableName}.request.vtl`), requestTemplate);
        fs.writeFileSync(path.join(templatesDir, `Mutation.${op.name}${tableName}.response.vtl`), responseTemplate);
      }
    });
  });
  
  console.log('✅ Generated mapping templates');
  
  // Generate entity configurations
  generateEntityConfigs();
}

function generateEntityConfigs() {
  const scriptsDir = path.join(__dirname, '../dml_scripts/individual_tables');
  const entityConfigDir = path.join(__dirname, '../../src/config/entities');
  const files = fs.readdirSync(scriptsDir).filter(file => file.endsWith('.sql'));
  
  // Ensure entity config directory exists
  if (!fs.existsSync(entityConfigDir)) {
    fs.mkdirSync(entityConfigDir, { recursive: true });
  }
  
  // Get list of tables that should have entity configs
  const requiredTables = files
    .map(file => file.replace('.sql', ''))
    .filter(tableName => tableConfig.tables[tableName]?.includeInApp);
  
  files.forEach(file => {
    const tableName = file.replace('.sql', '');
    
    // Skip if not included in app
    if (!tableConfig.tables[tableName]?.includeInApp) return;
    
    const entityConfigPath = path.join(entityConfigDir, `${tableName}.js`);
    
    // Check if file already exists
    if (fs.existsSync(entityConfigPath)) {
      console.log(`Entity config for ${tableName} already exists - preserving custom settings`);
      
      // Only update fields array to match current database structure
      const sql = fs.readFileSync(path.join(scriptsDir, file), 'utf8');
      const parsed = parseCreateTableSQL(sql);
      
      if (parsed) {
        const newFields = parsed.columns.map(col => col.name);
        
        // Read existing config and update only the fields array
        let existingConfig = fs.readFileSync(entityConfigPath, 'utf8');
        
        // Update only fields array to preserve custom formFields and foreignKeys
        const fieldsRegex = /fields:\s*\[[^\]]*\]/s;
        const newFieldsString = `fields: ${JSON.stringify(newFields, null, 2).replace(/\n/g, '\n  ')}`;
        
        if (fieldsRegex.test(existingConfig)) {
          existingConfig = existingConfig.replace(fieldsRegex, newFieldsString);
        }
        
        fs.writeFileSync(entityConfigPath, existingConfig);
        console.log(`Updated fields and formFields arrays for ${tableName}`);
      }
      return;
    }
    
    // Generate new entity config file
    console.log(`Creating new entity config for ${tableName}...`);
    
    const sql = fs.readFileSync(path.join(scriptsDir, file), 'utf8');
    const parsed = parseCreateTableSQL(sql);
    
    if (!parsed) return;
    
    const fields = parsed.columns.map(col => col.name);
    let formFields = parsed.columns
      .filter(col => {
        // Exclude auto-increment primary key fields
        if (col.name === parsed.primaryKey) {
          const sql = fs.readFileSync(path.join(scriptsDir, file), 'utf8');
          return !sql.includes('AUTO_INCREMENT');
        }
        return true;
      })
      .map(col => ({
        name: col.name,
        type: getFormFieldType(col.type),
        required: col.required && !col.name.includes('CHANGED_') && !col.name.includes('CREATED_'),
        disabled: col.name.includes('CHANGED_DATE') || col.name.includes('CREATED_DATE')
      }));
    
    // Update form fields for foreign keys
    formFields = updateFormFieldsForForeignKeys(formFields, foreignKeys);
    
    const foreignKeys = detectForeignKeys(parsed.columns, tableName);
    const fieldLookups = generateFieldLookups(foreignKeys);
    
    const foreignKeysString = Object.keys(foreignKeys).length > 0 
      ? `\n  
  // Foreign key lookups
  foreignKeys: ${JSON.stringify(foreignKeys, null, 2).replace(/\n/g, '\n  ')},`
      : '';
    
    const fieldLookupsString = Object.keys(fieldLookups).length > 0
      ? `\n  
  // Field lookups for display enhancement
  fieldLookups: ${JSON.stringify(fieldLookups, null, 2).replace(/\n/g, '\n  ')},`
      : '';
    
    const entityConfig = `export default {
  name: '${tableName}',
  idField: '${parsed.primaryKey}',
  
  // Form processing configuration
  keepAuditFieldsOnUpdate: false,
  
  // Environment copy configuration
  preserveOnCopy: ['${parsed.primaryKey}'],
  
  // Environment comparison configuration
  comparisonConfig: {
    matchingFields: ['${getMainIdentifierField(parsed.columns)}'],
    stringMatchFields: ['${getMainIdentifierField(parsed.columns)}'],
    stringMatchThreshold: 0.50
  },${foreignKeysString}${fieldLookupsString}
  
  // Fields configuration
  fields: ${JSON.stringify(fields, null, 2).replace(/\n/g, '\n  ')},
  
  // Form fields configuration
  formFields: ${JSON.stringify(formFields, null, 2).replace(/\n/g, '\n  ')}
};`;
    
    fs.writeFileSync(entityConfigPath, entityConfig);
  });
  
  console.log('✅ Generated/updated entity configurations');
  
  // Generate frontend GraphQL files
  generateFrontendGraphQL();
}

function generateFrontendGraphQL() {
  const scriptsDir = path.join(__dirname, '../dml_scripts/individual_tables');
  const frontendGraphQLDir = path.join(__dirname, '../../src/graphql');
  const files = fs.readdirSync(scriptsDir).filter(file => file.endsWith('.sql'));
  
  // Ensure frontend GraphQL directory exists
  if (!fs.existsSync(frontendGraphQLDir)) {
    fs.mkdirSync(frontendGraphQLDir, { recursive: true });
  }
  
  // Special cases for query names to match GraphQL schema
  const queryNameOverrides = {
    'LOAN_APP_EXECS': 'listLoanAppExecs',
    'LOAN_APP_STEP_STATUS': 'listLoanAppStepStatus'
  };
  
  let queries = '';
  let mutations = '';
  
  files.forEach(file => {
    const tableName = file.replace('.sql', '');
    
    // Skip if not included in GraphQL
    if (!tableConfig.tables[tableName]?.includeInGraphQL) return;
    
    const sql = fs.readFileSync(path.join(scriptsDir, file), 'utf8');
    const parsed = parseCreateTableSQL(sql);
    
    if (!parsed) return;
    
    const tablePerms = tableConfig.tables[tableName];
    const camelCaseName = tableName.split('_').map((word, i) => 
      i === 0 ? word.toLowerCase() : word.charAt(0) + word.slice(1).toLowerCase()
    ).join('');
    const pascalCaseName = tableName.split('_').map(word => 
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join('');
    
    // Generate query
    if (tablePerms.allowQuery) {
      const fieldsList = parsed.columns.map(col => `        ${col.name}`).join('\n');
      const pluralName = tableName.endsWith('S') ? tableName : `${tableName}S`;
      
      // Use override name if specified, otherwise use default
      const queryExportName = queryNameOverrides[tableName] || `list${pascalCaseName}s`;
      const queryName = queryNameOverrides[tableName] ? queryNameOverrides[tableName].replace('list', 'List') : `List${pascalCaseName}s`;
      
      queries += `export const ${queryExportName} = \`
  query ${queryName} {
    list${pluralName} {
      items {
${fieldsList}
      }
      nextToken
    }
  }
\`;\n\n`;
    }
    
    // Generate mutations
    const fieldsList = parsed.columns.map(col => `      ${col.name}`).join('\n');
    
    if (tablePerms.allowCreate) {
      mutations += `export const create${pascalCaseName} = \`
  mutation Create${pascalCaseName}($input: Create${tableName}Input!) {
    create${tableName}(input: $input) {
${fieldsList}
    }
  }
\`;\n\n`;
    }
    
    if (tablePerms.allowUpdate) {
      mutations += `export const update${pascalCaseName} = \`
  mutation Update${pascalCaseName}($input: Update${tableName}Input!) {
    update${tableName}(input: $input) {
${fieldsList}
    }
  }
\`;\n\n`;
    }
    
    if (tablePerms.allowDelete) {
      mutations += `export const delete${pascalCaseName} = \`
  mutation Delete${pascalCaseName}($input: Delete${tableName}Input!) {
    delete${tableName}(input: $input) {
      ${parsed.primaryKey}
    }
  }
\`;\n\n`;
    }
  });
  
  // Write queries file
  fs.writeFileSync(path.join(frontendGraphQLDir, 'queries.js'), queries);
  
  // Write mutations file
  fs.writeFileSync(path.join(frontendGraphQLDir, 'mutations.js'), mutations);
  
  console.log('✅ Generated frontend GraphQL queries and mutations');
  
  // Update integration tests
  updateIntegrationTests();
  
  // Validate generated VTL templates
  console.log('\n🔍 Validating VTL templates...');
  try {
    require('child_process').execSync('npm run validate-vtl', { stdio: 'inherit' });
  } catch (error) {
    console.log('⚠️  VTL validation failed - templates may have issues');
  }
}

function updateIntegrationTests() {
  console.log('🧪 Updating integration tests...');
  
  const testDataGeneratorPath = path.join(__dirname, '../../src/tests/test-data-generator.js');
  
  // Check if test data generator exists
  if (!fs.existsSync(testDataGeneratorPath)) {
    console.log('⚠️  Test data generator not found - skipping test updates');
    return;
  }
  
  // The test data generator will automatically pick up changes from:
  // 1. SQL files in backend/dml_scripts/individual_tables/
  // 2. table_config.json permissions
  // 3. Generated GraphQL schema and mutations
  
  // No additional updates needed - tests are now fully dynamic
  console.log('✅ Integration tests are configured to use dynamic data generation');
  console.log('   Tests will automatically adapt to:');
  console.log('   - New/modified SQL table structures');
  console.log('   - Updated table permissions in table_config.json');
  console.log('   - Generated GraphQL schema and mutations');
}

function getFormFieldType(graphqlType) {
  switch (graphqlType.toLowerCase()) {
    case 'int': return 'number';
    case 'string': return 'text';
    default: return 'text';
  }
}

function detectForeignKeys(columns, tableName) {
  const foreignKeys = {};
  
  columns.forEach(col => {
    // Detect foreign key pattern: ends with _ID and not the table's own primary key
    if (col.name.endsWith('_ID') && col.name !== `${tableName}_ID`) {
      const referencedTable = col.name.replace('_ID', '');
      
      // Get display field from table_config.json or use default pattern
      let displayField = tableConfig.foreignKeyDisplayFields?.[referencedTable] || `${referencedTable}_NAME`;
      
      foreignKeys[col.name] = {
        table: referencedTable,
        valueField: col.name,
        displayField: displayField
      };
    }
  });
  
  return foreignKeys;
}

function generateFieldLookups(foreignKeys) {
  const fieldLookups = {};
  
  Object.entries(foreignKeys).forEach(([fieldName, fkConfig]) => {
    fieldLookups[fieldName] = {
      lookupTable: fkConfig.table,
      foreignKey: fieldName,
      displayField: fkConfig.displayField,
      displayFormat: `{${fieldName}}: {${fkConfig.displayField}}`
    };
  });
  
  return fieldLookups;
}

function updateFormFieldsForForeignKeys(formFields, foreignKeys) {
  return formFields.map(field => {
    if (foreignKeys[field.name]) {
      return {
        ...field,
        type: 'select',
        options: []
      };
    }
    return field;
  });
}

function getMainIdentifierField(columns) {
  // Look for common name fields
  const nameField = columns.find(col => 
    col.name.includes('NAME') || 
    col.name.includes('DESC') ||
    col.name.includes('TITLE')
  );
  return nameField ? nameField.name : columns[1]?.name || columns[0]?.name;
}

generateSchemaFromSQL();