#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const tableConfigPath = path.join(__dirname, '../dml_scripts/table_config.json');
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
      schemaQueries += `  list${tableName}S: ${tableName}Connection @aws_auth(cognito_groups: ["readonly", "developer", "deployment", "admin"])\n`;
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
    
    // Query templates (only if allowed)
    if (tablePerms.allowQuery) {
      const listRequestTemplate = `{
  "version": "2018-05-29",
  "statements": [
    "SELECT * FROM ${tableName} ORDER BY ${tableName}_ID#if($ctx.args.nextToken) OFFSET $ctx.args.nextToken#end#if($ctx.args.limit) LIMIT $ctx.args.limit#end"
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

      fs.writeFileSync(path.join(templatesDir, `Query.list${tableName}S.request.vtl`), listRequestTemplate);
      fs.writeFileSync(path.join(templatesDir, `Query.list${tableName}S.response.vtl`), listResponseTemplate);
    }

    // Get primary key for this table
    const sql = fs.readFileSync(path.join(scriptsDir, file), 'utf8');
    const parsed = parseCreateTableSQL(sql);
    const primaryKey = parsed ? parsed.primaryKey : `${tableName}_ID`;
    
    // Mutation templates (only for allowed operations)
    const createRequestTemplate = `{
  "version": "2018-05-29",
  "statements": [
    #set($insertStatement = "INSERT INTO ${tableName} (")
    #set($valuesStatement = " VALUES (")
    #set($first = true)
    #foreach($entry in $ctx.args.input.entrySet())
      #if($entry.value)
        #if(!$first)
          #set($insertStatement = "$insertStatement, ")
          #set($valuesStatement = "$valuesStatement, ")
        #end
        #set($insertStatement = "$insertStatement$entry.key")
        #set($valuesStatement = "$valuesStatement'$entry.value'")
        #set($first = false)
      #end
    #end
    #set($insertStatement = "$insertStatement)$valuesStatement)")
    "$insertStatement"
  ]
}`;

    const updateRequestTemplate = `{
  "version": "2018-05-29",
  "statements": [
    #set($updateStatement = "UPDATE ${tableName} SET ")
    #set($first = true)
    #foreach($entry in $ctx.args.input.entrySet())
      #if($entry.key != "${primaryKey}" && $entry.value)
        #if(!$first)
          #set($updateStatement = "$updateStatement, ")
        #end
        #set($updateStatement = "$updateStatement$entry.key = '$entry.value'")
        #set($first = false)
      #end
    #end
    #set($updateStatement = "$updateStatement WHERE ${primaryKey} = '$ctx.args.input.${primaryKey}'")
    "$updateStatement"
  ]
}`;

    const deleteRequestTemplate = `{
  "version": "2018-05-29",
  "statements": [
    "DELETE FROM ${tableName} WHERE ${primaryKey} = '$ctx.args.input.${primaryKey}'"
  ]
}`;

    const mutationResponseTemplate = `## Handle RDS Data API response for MySQL (no RETURNING clause)
#if($ctx.error)
    $utils.error($ctx.error.message, $ctx.error.type)
#end

## MySQL INSERT/UPDATE doesn't return data, so return input with success indicator
$util.toJson($ctx.args.input)`;

    const operations = [
      { name: 'create', allowed: tablePerms.allowCreate },
      { name: 'update', allowed: tablePerms.allowUpdate },
      { name: 'delete', allowed: tablePerms.allowDelete }
    ];
    
    operations.forEach(op => {
      if (op.allowed) {
        let requestTemplate;
        if (op.name === 'create') requestTemplate = createRequestTemplate;
        else if (op.name === 'update') requestTemplate = updateRequestTemplate;
        else if (op.name === 'delete') requestTemplate = deleteRequestTemplate;
        
        fs.writeFileSync(path.join(templatesDir, `Mutation.${op.name}${tableName}.request.vtl`), requestTemplate);
        fs.writeFileSync(path.join(templatesDir, `Mutation.${op.name}${tableName}.response.vtl`), mutationResponseTemplate);
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
      queries += `export const list${pascalCaseName}s = \`
  query List${pascalCaseName}s {
    list${tableName}S {
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
  
  // Validate generated VTL templates
  console.log('\n🔍 Validating VTL templates...');
  try {
    require('child_process').execSync('npm run validate-vtl', { stdio: 'inherit' });
  } catch (error) {
    console.log('⚠️  VTL validation failed - templates may have issues');
  }
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