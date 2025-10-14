#!/usr/bin/env node

const { RDSDataClient, ExecuteStatementCommand } = require('@aws-sdk/client-rds-data');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const stage = process.argv[2] || 'dev';
const dbConfig = yaml.load(fs.readFileSync(path.join(__dirname, '../../config/database-config.yml'), 'utf8'));
const stageConfig = dbConfig.stages[stage];
const rdsData = new RDSDataClient({ region: 'us-east-2' });

async function generateAlterStatements(tableName, createTableSQL) {
  const clusterArn = `arn:aws:rds:us-east-2:794611117044:cluster:${stageConfig.clusterIdentifier}`;
  const secretArn = stageConfig.secretArn;
  const database = stageConfig.databaseName;

  // Parse desired schema from CREATE TABLE
  const desiredSchema = parseCreateTableSQL(createTableSQL);
  if (!desiredSchema) return [];

  try {
    // Get current table structure
    const currentResult = await rdsData.send(new ExecuteStatementCommand({
      resourceArn: clusterArn,
      secretArn: secretArn,
      database: database,
      sql: `SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY, COLUMN_DEFAULT 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = '${database}' AND TABLE_NAME = '${tableName}' 
            ORDER BY ORDINAL_POSITION`
    }));

    if (!currentResult.records || currentResult.records.length === 0) {
      // Table doesn't exist, return CREATE TABLE
      return [createTableSQL];
    }

    const currentColumns = new Map();
    currentResult.records.forEach(row => {
      currentColumns.set(row[0].stringValue.toUpperCase(), {
        type: row[1].stringValue.toLowerCase(),
        nullable: row[2].stringValue,
        key: row[3] ? row[3].stringValue : '',
        default: row[4] ? row[4].stringValue : null
      });
    });

    const alterStatements = [];

    // Check each desired column
    desiredSchema.columns.forEach(desiredCol => {
      const currentCol = currentColumns.get(desiredCol.name);
      
      if (!currentCol) {
        // Column doesn't exist - add it
        const nullable = desiredCol.nullable === 'YES' ? '' : ' NOT NULL';
        const defaultVal = desiredCol.default ? ` DEFAULT ${desiredCol.default}` : '';
        alterStatements.push(
          `ALTER TABLE \`${tableName}\` ADD COLUMN \`${desiredCol.name}\` ${desiredCol.type}${nullable}${defaultVal};`
        );
      } else if (currentCol.type.replace(/\s+/g, '') !== desiredCol.type.replace(/\s+/g, '')) {
        // Column type differs - modify it
        const nullable = desiredCol.nullable === 'YES' ? '' : ' NOT NULL';
        const defaultVal = desiredCol.default ? ` DEFAULT ${desiredCol.default}` : '';
        alterStatements.push(
          `ALTER TABLE \`${tableName}\` MODIFY COLUMN \`${desiredCol.name}\` ${desiredCol.type}${nullable}${defaultVal};`
        );
      }
    });

    // Check for extra columns to remove (if --remove-extra flag is used)
    if (process.argv.includes('--remove-extra')) {
      console.log(`🗑️ Removing extra columns for ${tableName}...`);
      const desiredColumns = new Set(desiredSchema.columns.map(col => col.name));
      currentColumns.forEach((colInfo, colName) => {
        if (!desiredColumns.has(colName)) {
          console.log(`   Dropping column: ${colName}`);
          alterStatements.push(`ALTER TABLE \`${tableName}\` DROP COLUMN \`${colName}\`;`);
        }
      });
    }

    return alterStatements;

  } catch (error) {
    // If we can't query the table, assume it doesn't exist
    return [createTableSQL];
  }
}

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
  
  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('`')) {
      const colMatch = trimmed.match(/^`(\w+)`\s+(\w+(?:\([^)]*\))?)/);
      if (colMatch) {
        const [, colName, dataType] = colMatch;
        const nullable = trimmed.includes('NOT NULL') ? 'NO' : 'YES';
        const defaultMatch = trimmed.match(/DEFAULT\s+([^,\s]+)/i);
        const defaultVal = defaultMatch ? defaultMatch[1] : null;
        
        columns.push({
          name: colName.toUpperCase(),
          type: dataType.toLowerCase(),
          nullable: nullable,
          default: defaultVal
        });
      }
    }
  });
  
  return { tableName, columns };
}

async function smartSchemaUpdate(sqlFile) {
  const sql = fs.readFileSync(sqlFile, 'utf8');
  const tableName = path.basename(sqlFile, '.sql');
  
  console.log(`🔍 Analyzing ${tableName}...`);
  
  const statements = await generateAlterStatements(tableName, sql);
  
  if (statements.length === 0) {
    console.log(`✅ ${tableName} - No changes needed`);
    return;
  }
  
  console.log(`🔧 ${tableName} - Executing ${statements.length} statement(s):`);
  statements.forEach(stmt => console.log(`   ${stmt.substring(0, 80)}...`));
  
  const clusterArn = `arn:aws:rds:us-east-2:794611117044:cluster:${stageConfig.clusterIdentifier}`;
  const secretArn = stageConfig.secretArn;
  const database = stageConfig.databaseName;
  
  for (const statement of statements) {
    try {
      await rdsData.send(new ExecuteStatementCommand({
        resourceArn: clusterArn,
        secretArn: secretArn,
        database: database,
        sql: statement
      }));
    } catch (error) {
      if (error.message.includes('Duplicate column name')) {
        console.log(`   ℹ️ Column already exists, skipping...`);
      } else {
        throw error;
      }
    }
  }
  
  console.log(`✅ ${tableName} completed`);
}

module.exports = { smartSchemaUpdate, generateAlterStatements };