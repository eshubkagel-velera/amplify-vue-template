#!/usr/bin/env node

const { RDSDataClient, ExecuteStatementCommand } = require('@aws-sdk/client-rds-data');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const stage = process.argv[2] || 'dev';
const dbConfigFile = path.join(__dirname, '../../config/database-config.yml');
const dbConfig = yaml.load(fs.readFileSync(dbConfigFile, 'utf8'));
const stageConfig = dbConfig.stages[stage];

const rdsData = new RDSDataClient({ region: 'us-east-2' });

async function testConnection() {
  const clusterArn = `arn:aws:rds:us-east-2:794611117044:cluster:${stageConfig.clusterIdentifier}`;
  const secretArn = stageConfig.secretArn;
  const database = stageConfig.databaseName;
  
  console.log(`🔍 Testing connection to ${stage.toUpperCase()} environment:`);
  console.log(`   Cluster: ${stageConfig.clusterIdentifier}`);
  console.log(`   Database: ${database}`);
  console.log(`   Secret: ${secretArn.split(':').pop()}`);
  
  try {
    // Test basic connection
    const result = await rdsData.send(new ExecuteStatementCommand({
      resourceArn: clusterArn,
      secretArn: secretArn,
      database: database,
      sql: 'SELECT 1 as test'
    }));
    
    console.log('✅ Database connection successful');
    
    // List existing tables
    const tablesResult = await rdsData.send(new ExecuteStatementCommand({
      resourceArn: clusterArn,
      secretArn: secretArn,
      database: database,
      sql: `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = '${database}' ORDER BY TABLE_NAME`
    }));
    
    if (tablesResult.records && tablesResult.records.length > 0) {
      console.log(`\n📋 Existing tables in ${database}:`);
      tablesResult.records.forEach(row => {
        console.log(`   - ${row[0].stringValue}`);
      });
    } else {
      console.log(`\n📋 No tables found in ${database}`);
    }
    
    // Test specific table
    const configParamResult = await rdsData.send(new ExecuteStatementCommand({
      resourceArn: clusterArn,
      secretArn: secretArn,
      database: database,
      sql: `SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = '${database}' AND TABLE_NAME = 'CONFIG_PARAM'`
    }));
    
    const count = configParamResult.records[0][0].longValue || 0;
    console.log(`\n🔍 CONFIG_PARAM table exists: ${count > 0 ? 'YES' : 'NO'}`);
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    if (error.message.includes('AccessDenied')) {
      console.error('   This might be a permissions issue with the secret or cluster');
    }
  }
}

testConnection().catch(console.error);