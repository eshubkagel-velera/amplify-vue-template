#!/usr/bin/env node

const { RDSDataClient, ExecuteStatementCommand } = require('@aws-sdk/client-rds-data');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Load database configuration from central file
const stage = process.argv[2] || process.env.STAGE || 'dev';
const dbConfigFile = path.join(__dirname, '../../config/database-config.yml');

if (!fs.existsSync(dbConfigFile)) {
  console.error('❌ database-config.yml not found');
  process.exit(1);
}

const dbConfig = yaml.load(fs.readFileSync(dbConfigFile, 'utf8'));
const stageConfig = dbConfig.stages[stage];

if (!stageConfig) {
  console.error(`❌ Stage '${stage}' not found in database-config.yml`);
  process.exit(1);
}

console.log(`📁 Loaded configuration for ${stage.toUpperCase()} environment from database-config.yml`);

const rdsData = new RDSDataClient({ region: 'us-east-2' });

async function validateConnection() {
  try {
    const clusterArn = `arn:aws:rds:us-east-2:794611117044:cluster:${stageConfig.clusterIdentifier}`;
    const secretArn = stageConfig.secretArn;
    const database = stageConfig.databaseName;
    
    // Test connection with simple query
    await rdsData.send(new ExecuteStatementCommand({
      resourceArn: clusterArn,
      secretArn: secretArn,
      database: database,
      sql: 'SELECT 1'
    }));
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    if (error.message.includes('security token') || error.message.includes('InvalidClientTokenId')) {
      console.error('\n💡 This appears to be an AWS authentication issue.');
      console.error('   Please check your AWS credentials and try again.');
    }
    throw new Error(`Database connection failed: ${error.message}`);
  }
}

async function getCurrentTableStructure(tableName) {
  try {
    const clusterArn = `arn:aws:rds:us-east-2:794611117044:cluster:${stageConfig.clusterIdentifier}`;
    const secretArn = stageConfig.secretArn;
    const database = stageConfig.databaseName;
    
    // Check if table exists
    const tableExistsQuery = `SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = '${database}' AND TABLE_NAME = '${tableName}'`;
    const tableExistsResult = await rdsData.send(new ExecuteStatementCommand({
      resourceArn: clusterArn,
      secretArn: secretArn,
      database: database,
      sql: tableExistsQuery
    }));
    
    const tableCount = tableExistsResult.records && tableExistsResult.records[0] && tableExistsResult.records[0][0] 
      ? (tableExistsResult.records[0][0].longValue || parseInt(tableExistsResult.records[0][0].stringValue) || 0)
      : 0;
    
    if (tableCount === 0 || tableCount === '0') {
      return { exists: false };
    }
    
    // Get column information with full data type including length
    const columnsQuery = `SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = '${database}' AND TABLE_NAME = '${tableName}' ORDER BY ORDINAL_POSITION`;
    const columnsResult = await rdsData.send(new ExecuteStatementCommand({
      resourceArn: clusterArn,
      secretArn: secretArn,
      database: database,
      sql: columnsQuery
    }));
    
    const columns = columnsResult.records ? columnsResult.records.map(row => ({
      COLUMN_NAME: row[0].stringValue.toUpperCase(),
      DATA_TYPE: row[1].stringValue.toLowerCase(), // This is COLUMN_TYPE which includes length
      IS_NULLABLE: row[2].stringValue,
      COLUMN_KEY: row[3] ? row[3].stringValue : ''
    })) : [];
    
    return { exists: true, columns };
  } catch (error) {
    // If authentication fails, throw error instead of continuing
    if (error.message.includes('security token') || error.message.includes('InvalidClientTokenId')) {
      throw new Error(`Database authentication failed: ${error.message}`);
    }
    // For other errors, assume table doesn't exist
    if (process.argv.includes('--verbose')) {
      console.error(`⚠️  Database query failed for table ${tableName}:`, error.message);
    }
    return { exists: false };
  }
}

function parseCreateTableSQL(sql) {
  if (!sql.includes('CREATE TABLE')) return null;
  
  const createTableMatch = sql.match(/CREATE TABLE[^(]*\(([^;]+)\)/s);
  if (!createTableMatch) return null;
  
  const tableContent = createTableMatch[1];
  const columns = [];
  
  // Split by comma but be careful about commas inside parentheses
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
  
  lines.forEach(line => {
    const trimmed = line.trim();
    
    // Only process lines that start with backtick (column definitions)
    if (trimmed.startsWith('`')) {
      // Match: `COLUMN_NAME` DATATYPE [NOT NULL] [AUTO_INCREMENT] [DEFAULT ...]
      const colMatch = trimmed.match(/^`(\w+)`\s+(\w+(?:\([^)]*\))?)/); 
      if (colMatch) {
        const [, colName, dataType] = colMatch;
        
        columns.push({
          COLUMN_NAME: colName.toUpperCase(),
          DATA_TYPE: dataType.toLowerCase(),
          IS_NULLABLE: trimmed.includes('NOT NULL') ? 'NO' : 'YES',
          COLUMN_KEY: trimmed.includes('AUTO_INCREMENT') ? 'PRI' : ''
        });
      }
    }
  });
  
  return { columns };
}

function compareTableStructures(current, newStruct, tableName) {
  const changes = [];
  
  if (!current || !current.exists) {
    changes.push(`🆕 Table will be created (${newStruct.columns.length} columns)`);
    return changes;
  }
  
  // Compare columns
  const currentCols = new Map(current.columns.map(col => [col.COLUMN_NAME, col]));
  const newCols = new Map(newStruct.columns.map(col => [col.COLUMN_NAME, col]));
  
  let hasChanges = false;
  
  // New columns
  for (const [colName, colDef] of newCols) {
    if (!currentCols.has(colName)) {
      changes.push(`➕ Missing column: ${colName} ${colDef.DATA_TYPE}`);
      hasChanges = true;
    } else {
      const currentCol = currentCols.get(colName);
      const normalizedCurrent = currentCol.DATA_TYPE.replace(/\s+/g, '');
      const normalizedExpected = colDef.DATA_TYPE.replace(/\s+/g, '');
      if (normalizedCurrent !== normalizedExpected) {
        changes.push(`🔧 Column type differs: ${colName} (current: ${currentCol.DATA_TYPE}, expected: ${colDef.DATA_TYPE})`);
        hasChanges = true;
      }
    }
  }
  
  // Extra columns in current table
  for (const [colName] of currentCols) {
    if (!newCols.has(colName)) {
      if (process.argv.includes('--remove-extra')) {
        changes.push(`➖ Will remove extra column: ${colName}`);
        hasChanges = true;
      } else {
        changes.push(`ℹ️ Extra column in database: ${colName} (use --remove-extra to remove)`);
      }
    }
  }
  
  if (!hasChanges && changes.length === 0) {
    changes.push(`✅ Table structure matches - no changes needed`);
  }
  
  return changes;
}

function getChangeType(sql) {
  const hasDropTable = sql.includes('DROP TABLE');
  const isCreateTable = sql.includes('CREATE TABLE');
  
  if (hasDropTable && isCreateTable) {
    return '🔄 DROP & RECREATE';
  } else if (isCreateTable) {
    return '📊 TABLE';
  } else {
    return '📝 MODIFY';
  }
}

async function analyzeSQLChanges(sql, tableName) {
  const changes = [];
  const lines = sql.split('\n').map(line => line.trim());
  
  // Get current table structure for comparison
  const currentStructure = await getCurrentTableStructure(tableName);
  const newStructure = parseCreateTableSQL(sql);
  
  // Show summary of table structure for CREATE TABLE operations
  if (sql.includes('CREATE TABLE')) {
    const createTableMatch = sql.match(/CREATE TABLE[^(]*\(([^;]+)\)/s);
    if (createTableMatch) {
      const tableContent = createTableMatch[1];
      
      // Count columns
      const lines = tableContent.split(',').map(line => line.trim());
      const columnCount = lines.filter(line => {
        const trimmed = line.trim();
        return trimmed.match(/^`?\w+`?\s+\w+/) && 
               !trimmed.startsWith('PRIMARY KEY') && 
               !trimmed.startsWith('FOREIGN KEY') && 
               !trimmed.startsWith('KEY ') && 
               !trimmed.startsWith('INDEX ') && 
               !trimmed.startsWith('CONSTRAINT') &&
               !trimmed.startsWith('UNIQUE INDEX');
      }).length;
      
      // Count foreign keys
      const fkCount = (tableContent.match(/FOREIGN KEY/g) || []).length;
      
      // Count indexes (excluding PRIMARY)
      const indexCount = (tableContent.match(/(?:UNIQUE\s+)?(?:KEY|INDEX)\s+\w+/g) || [])
        .filter(match => !match.includes('PRIMARY')).length;
      
      changes.push(`📊 ${columnCount} columns, ${fkCount} foreign keys, ${indexCount} indexes`);
    }
  }
  
  // Analyze ALTER TABLE statements with details
  const alterMatches = sql.match(/ALTER TABLE[^;]+;/g);
  if (alterMatches) {
    alterMatches.forEach(alter => {
      // ADD COLUMN with type details
      const addColMatch = alter.match(/ADD COLUMN\s+(\w+)\s+([^,;]+)/i);
      if (addColMatch) {
        const [, colName, colDef] = addColMatch;
        changes.push(`➕ Add Column: ${colName} ${colDef.trim()}`);
      }
      
      // DROP COLUMN
      const dropColMatch = alter.match(/DROP COLUMN\s+(\w+)/i);
      if (dropColMatch) {
        changes.push(`➖ Drop Column: ${dropColMatch[1]}`);
      }
      
      // MODIFY COLUMN with details
      const modifyColMatch = alter.match(/MODIFY COLUMN\s+(\w+)\s+([^,;]+)/i);
      if (modifyColMatch) {
        const [, colName, newDef] = modifyColMatch;
        changes.push(`🔧 Modify Column: ${colName} → ${newDef.trim()}`);
      }
      
      // ADD INDEX with name and columns
      const addIndexMatch = alter.match(/ADD INDEX\s+(\w+)\s*\(([^)]+)\)/i);
      if (addIndexMatch) {
        const [, indexName, indexCols] = addIndexMatch;
        changes.push(`📁 Add Index: ${indexName} (${indexCols.trim()})`);
      }
      
      // DROP INDEX with name
      const dropIndexMatch = alter.match(/DROP INDEX\s+(\w+)/i);
      if (dropIndexMatch) {
        changes.push(`🗑️ Drop Index: ${dropIndexMatch[1]}`);
      }
      
      // ADD FOREIGN KEY
      const addFkMatch = alter.match(/ADD FOREIGN KEY\s*\(([^)]+)\)\s*REFERENCES\s+(\w+)\s*\(([^)]+)\)/i);
      if (addFkMatch) {
        const [, localCol, refTable, refCol] = addFkMatch;
        changes.push(`🔗 Add Foreign Key: ${localCol.trim()} → ${refTable}.${refCol.trim()}`);
      }
    });
  }
  
  // Analyze data changes with details
  const insertMatches = [...sql.matchAll(/INSERT INTO\s+(\w+)[^;]+;/g)];
  if (insertMatches.length > 0) {
    changes.push(`💾 Data Inserts (${insertMatches.length}):`);
    insertMatches.forEach((match, i) => {
      const tableName = match[1];
      const valueMatch = match[0].match(/VALUES\s*\(([^)]+)\)/);
      if (valueMatch && i < 3) { // Show first 3 inserts
        changes.push(`     • ${tableName}: ${valueMatch[1].substring(0, 50)}${valueMatch[1].length > 50 ? '...' : ''}`);
      } else if (i === 3) {
        changes.push(`     • ... and ${insertMatches.length - 3} more`);
      }
    });
  }
  
  const updateMatches = [...sql.matchAll(/UPDATE\s+(\w+)\s+SET\s+([^;]+);/g)];
  if (updateMatches.length > 0) {
    changes.push(`🔄 Data Updates (${updateMatches.length}):`);
    updateMatches.forEach((match, i) => {
      if (i < 3) {
        const [, tableName, setClause] = match;
        changes.push(`     • ${tableName}: SET ${setClause.substring(0, 50)}${setClause.length > 50 ? '...' : ''}`);
      } else if (i === 3) {
        changes.push(`     • ... and ${updateMatches.length - 3} more`);
      }
    });
  }
  
  const deleteMatches = [...sql.matchAll(/DELETE FROM\s+(\w+)([^;]*);/g)];
  if (deleteMatches.length > 0) {
    changes.push(`🗑️ Data Deletions (${deleteMatches.length}):`);
    deleteMatches.forEach((match, i) => {
      if (i < 3) {
        const [, tableName, whereClause] = match;
        const condition = whereClause.trim() || 'ALL ROWS';
        changes.push(`     • ${tableName}: ${condition.substring(0, 50)}${condition.length > 50 ? '...' : ''}`);
      } else if (i === 3) {
        changes.push(`     • ... and ${deleteMatches.length - 3} more`);
      }
    });
  }
  
  // Compare with current database structure
  if (currentStructure && newStructure) {
    const structureChanges = compareTableStructures(currentStructure, newStructure, tableName);
    changes.unshift(...structureChanges);
  } else if (!currentStructure && newStructure) {
    // Database query failed, assume table doesn't exist
    changes.unshift(`🆕 Table will be created (${newStructure.columns.length} columns)`);
  }
  
  return changes;
}



// Define table execution order
const tableOrder = [
  'CONFIG_PARAM.sql', 'STEP_TYPE.sql', 'SERVICE_PROVIDER.sql', 'ORIGIN_PRODUCT.sql',
  'LOAN_APP.sql', 'REDIRECT_URL.sql', 'FILTER_CRITERIA.sql', 'SORT_CRITERIA.sql',
  'SERVICE.sql', 'SERVICE_DOMAIN.sql', 'SERVICE_PARAM.sql', 'LOAN_APP_EXECS.sql',
  'NEW_MEMBER_TOKEN.sql', 'SERVICE_PARAM_MAPPING.sql', 'LOAN_APP_STEP_STATUS.sql',
  'SERVICE_EXPR_MAPPING.sql', 'STEP_TYPE_PARAM_MAP.sql', 'STEP_SERVICE_MAPPING.sql'
];

async function showSummary() {
  // Validate connection before proceeding
  await validateConnection();
  
  const scriptsDir = path.join(__dirname, '../dml_scripts/individual_tables');
  const existingFiles = tableOrder.filter(file => fs.existsSync(path.join(scriptsDir, file)));
  const missingFiles = tableOrder.filter(file => !fs.existsSync(path.join(scriptsDir, file)));
  
  console.log(`\n📋 DATABASE UPDATE SUMMARY - ${stage.toUpperCase()} Environment`);
  console.log(`Target: ${stageConfig.clusterIdentifier} (${stageConfig.databaseName})`);
  console.log(`\n✅ Tables with changes:`);
  
  let tablesWithChanges = 0;
  
  for (const file of existingFiles) {
    const tableName = file.replace('.sql', '');
    const filePath = path.join(scriptsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    // Analyze SQL content for detailed changes
    const changes = await analyzeSQLChanges(sql, tableName);
    const changeType = getChangeType(sql);
    
    // Only show tables that have actual changes or will be created
    const hasChanges = changes.some(change => 
      change.includes('will be created') || 
      change.includes('Missing column') || 
      change.includes('differs') || 
      change.includes('Extra column')
    );
    
    if (hasChanges) {
      tablesWithChanges++;
      console.log(`   - ${tableName} ${changeType}`);
      if (changes.length > 0) {
        changes.forEach(change => console.log(`     ${change}`));
      }
    }
  }
  
  if (tablesWithChanges === 0) {
    console.log('   No tables need changes - all structures match!');
  }
  
  if (missingFiles.length > 0) {
    console.log(`\n⚠️  Missing table scripts (${missingFiles.length}):`);
    missingFiles.forEach(file => console.log(`   - ${file.replace('.sql', '')}`));
  }
  
  console.log(`\n📊 Total files: ${existingFiles.length}, Tables with changes: ${tablesWithChanges}`);
  console.log(`\n🔄 Execution order: dependency-safe table creation`);
  console.log(`\n⚡ Using AWS RDS Data API for serverless execution\n`);
}

async function runDMLViaRDSData() {
  const clusterArn = `arn:aws:rds:us-east-2:794611117044:cluster:${stageConfig.clusterIdentifier}`;
  const secretArn = stageConfig.secretArn;
  const database = stageConfig.databaseName;
  
  if (!clusterArn || !secretArn) {
    console.error('❌ Missing RDS cluster or secret configuration');
    process.exit(1);
  }

  const scriptsDir = path.join(__dirname, '../dml_scripts/individual_tables');
  
  await showSummary();
  
  try {
    console.log('🚀 Starting DML updates via RDS Data API...\n');
    
    for (const file of tableOrder) {
      const filePath = path.join(scriptsDir, file);
      
      if (!fs.existsSync(filePath)) {
        console.warn(`⚠️  ${file.replace('.sql', '')} not found, skipping...`);
        continue;
      }
      
      // Use smart schema update that preserves data
      const { smartSchemaUpdate } = require('./smart-schema-update');
      await smartSchemaUpdate(filePath);
    }
    
    console.log('\n🎉 All DML updates completed successfully via RDS Data API');
  } catch (error) {
    console.error('❌ Error running DML updates:', error);
    process.exit(1);
  }
}

// Add --dry-run flag support
async function main() {
  if (process.argv.includes('--dry-run')) {
    await showSummary();
    console.log('\n🔍 DRY RUN MODE - No changes will be made\n');
    process.exit(0);
  }
  
  await runDMLViaRDSData();
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});