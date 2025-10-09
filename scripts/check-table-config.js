#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Load table configuration
const configPath = path.join(__dirname, '../backend/dml_scripts/table_config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Check which tables should be included in GraphQL/App
function checkTableInclusion() {
  console.log('Table Configuration Status:\n');
  
  Object.entries(config.tables).forEach(([tableName, settings]) => {
    const graphql = settings.includeInGraphQL ? '✅' : '❌';
    const app = settings.includeInApp ? '✅' : '❌';
    console.log(`${tableName.padEnd(25)} GraphQL: ${graphql} App: ${app}`);
  });
  
  console.log('\nLegend: ✅ = Included, ❌ = Database Only');
}

checkTableInclusion();