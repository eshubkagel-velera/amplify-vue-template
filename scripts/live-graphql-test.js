#!/usr/bin/env node

import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
const envPath = resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
}

// Import GraphQL operations and client
const srcPath = resolve(__dirname, '../src');
const queriesPath = `file://${resolve(srcPath, 'graphql/queries.js').replace(/\\/g, '/')}`;
const mutationsPath = `file://${resolve(srcPath, 'graphql/mutations.js').replace(/\\/g, '/')}`;

// Dynamic imports
const tableConfigData = require('../config/table_config.json');
const queries = await import(queriesPath);
const mutations = await import(mutationsPath);

// Get environment from command line argument or default to dev
const targetEnvironment = process.argv[2] || 'dev';

// Mock environment for Node.js
global.localStorage = {
  getItem: () => targetEnvironment,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {}
};

// Mock import.meta.env for frontend client
global.import = {
  meta: {
    env: process.env
  }
};

// Enable fetch for Node.js
if (!global.fetch) {
  const { default: fetch } = await import('node-fetch');
  global.fetch = fetch;
}

// Simple AWS Cognito authentication
async function getAuthToken() {
  const username = process.env.TEST_USERNAME;
  const password = process.env.TEST_PASSWORD;
  
  if (!username || !password) {
    throw new Error('TEST_USERNAME and TEST_PASSWORD must be set in .env file');
  }
  
  const authUrl = `https://cognito-idp.us-east-2.amazonaws.com/`;
  
  const authResponse = await fetch(authUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': 'AWSCognitoIdentityProviderService.InitiateAuth'
    },
    body: JSON.stringify({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: process.env.VITE_USER_POOL_CLIENT_ID,
      AuthParameters: {
        USERNAME: username,
        PASSWORD: password
      }
    })
  });
  
  const authResult = await authResponse.json();
  
  if (authResult.AuthenticationResult) {
    return authResult.AuthenticationResult.AccessToken;
  }
  
  throw new Error('Authentication failed: ' + (authResult.message || 'Unknown error'));
}

const TABLE_CONFIG = tableConfigData.tables;

// Test data for mutations with unique values and required fields
const timestamp = Date.now();
const dateStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
const SAMPLE_DATA = {
  'CONFIG_PARAM': { CONFIG_NAME: `TEST_CONFIG_${timestamp}`, CONFIG_VALUE: 'test_value', DESCRIPTION: 'Test config' },
  'ORIGIN_PRODUCT': { VENDOR_NAME: 'Test Vendor', PRODUCT_ID: `TEST_PROD_${timestamp}`, PSCU_CLIENT_ID: 12345, PRODUCT_DESC: 'Test Product', CREATED_BY_USER_ID: 1, CREATED_DATE: dateStr },
  'SERVICE_PROVIDER': { SERVICE_PROVIDER_NAME: `Test Provider ${timestamp}`, CREATED_BY_USER_ID: 1, CREATED_DATE: dateStr },
  'STEP_TYPE': { STEP_TYPE_NAME: `TEST_STEP_${timestamp}`, STEP_TYPE_DESC: 'Test step', RESOURCE_NAME: 'test-resource', CREATED_BY_USER_ID: 1, CREATED_DATE: dateStr },
  'SERVICE': { SERVICE_PROVIDER_ID: 1, URI: `https://test-service-${timestamp}.com`, CREATED_BY_USER_ID: 1, CREATED_DATE: dateStr },
  'REDIRECT_URL': { ORIGIN_PRODUCT_ID: null, URL_TYPE_CODE: timestamp % 2 === 0 ? 'N' : 'E', URL: `https://test-${timestamp}.com`, CREATED_BY_USER_ID: 1, CREATED_DATE: dateStr },
  'SERVICE_DOMAIN': { SERVICE_PROVIDER_ID: 1, DOMAIN_URL: `https://test-domain-${timestamp}.com` },
  'SERVICE_PARAM': { SERVICE_ID: 1, PARAM_NAME: `TEST_PARAM_${timestamp}`, CREATED_BY_USER_ID: 1, CREATED_DATE: dateStr },
  'FILTER_CRITERIA': { ORIGIN_PRODUCT_ID: 1, STEP_TYPE_ID: 1, CRITERIA: `test criteria ${timestamp}`, SEQUENCE_NBR: Math.floor(Math.random() * 1000) },
  'SORT_CRITERIA': { ORIGIN_PRODUCT_ID: 1, STEP_TYPE_ID: 1, JSON_PATH: '$.test', SORT_ORDER: 'ASC', SORT_PRIORITY: 1, SEQUENCE_NBR: Math.floor(Math.random() * 1000) },
  'STEP_SERVICE_MAPPING': { STEP_TYPE_ID: null, SERVICE_ID: null, SEQUENCE_NBR: Math.floor(Math.random() * 1000) },
  'SERVICE_EXPR_MAPPING': { SERVICE_PARAM_MAPPING_ID: null, SOURCE_EXPR: `test.source.${timestamp}`, TARGET_EXPR: `test.target.${timestamp}`, CREATED_BY_USER_ID: 1, CREATED_DATE: dateStr },
  'SERVICE_PARAM_MAPPING': { ORIGIN_PRODUCT_ID: 1, SOURCE_SERVICE_PARAM_ID: 1, TARGET_SERVICE_PARAM_ID: 1, CREATED_BY_USER_ID: 1, CREATED_DATE: dateStr },
  'STEP_TYPE_PARAM_MAP': { STEP_TYPE_ID: 1, SERVICE_PARAM_MAPPING_ID: 1, CREATED_BY_USER_ID: '1' }
};

class LiveGraphQLTester {
  constructor() {
    this.results = {
      queries: { passed: 0, failed: 0, details: [] },
      mutations: { passed: 0, failed: 0, details: [] }
    };
    this.createdRecords = [];
  }

  async testQueries() {
    console.log('\n🔍 Testing GraphQL Queries...\n');
    
    for (const [queryName, queryString] of Object.entries(queries)) {
      if (queryName === 'default') continue;
      
      const tableName = this.extractTableName(queryName);
      if (!tableName) {
        console.log(`⏭️  Skipping ${queryName} (query doesn't exist in schema)`);
        continue;
      }
      
      console.log(`📋 Testing ${queryName}...`);

      try {
        
        // Direct GraphQL call using environment variables
        const envUrls = {
          dev: process.env.VITE_DEV_GRAPHQL_URL,
          test: process.env.VITE_TEST_GRAPHQL_URL,
          uat: process.env.VITE_UAT_GRAPHQL_URL,
          live: process.env.VITE_LIVE_GRAPHQL_URL
        };
        
        const endpoint = envUrls[targetEnvironment];
        if (!endpoint) {
          throw new Error(`No GraphQL endpoint configured for ${targetEnvironment}`);
        }
        
        const token = await getAuthToken();
        const result = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token
          },
          body: JSON.stringify({ query: queryString, variables: {} })
        }).then(res => res.json());
        
        if (result.errors) {
          throw new Error(result.errors[0].message);
        }
        
        const dataKey = Object.keys(result.data)[0];
        const items = result.data[dataKey]?.items || [];
        
        console.log(`✅ ${queryName} - Success (${items.length} items)`);
        this.results.queries.passed++;
        this.results.queries.details.push({ name: queryName, status: 'PASS', count: items.length });
        
      } catch (error) {
        console.log(`❌ ${queryName} - Failed: ${error.message}`);
        this.results.queries.failed++;
        this.results.queries.details.push({ name: queryName, status: 'FAIL', error: error.message });
      }
    }
  }

  async testMutations() {
    console.log('\n🔧 Testing GraphQL Mutations...\n');
    
    // Test CREATE mutations first
    await this.testCreateMutations();
    
    // Test UPDATE mutations
    await this.testUpdateMutations();
    
    // Test DELETE mutations (cleanup)
    await this.testDeleteMutations();
  }

  async testCreateMutations() {
    console.log('📝 Testing CREATE mutations...\n');
    
    // Create in proper dependency order (base tables first, then dependent tables)
    const createOrder = [
      // Base tables (no foreign keys)
      'CONFIG_PARAM', 'ORIGIN_PRODUCT', 'SERVICE_PROVIDER', 'STEP_TYPE',
      // Level 1 dependencies
      'SERVICE', 'REDIRECT_URL', 'SERVICE_DOMAIN',
      // Level 2 dependencies  
      'SERVICE_PARAM', 'FILTER_CRITERIA', 'SORT_CRITERIA',
      // Level 3 dependencies
      'SERVICE_PARAM_MAPPING', 'STEP_SERVICE_MAPPING',
      // Level 4 dependencies
      'SERVICE_EXPR_MAPPING', 'STEP_TYPE_PARAM_MAP'
    ];
    
    for (const tableName of createOrder) {
      const mutationName = `create${this.toCamelCase(tableName)}`;
      const mutationString = mutations[mutationName];
      
      if (!mutationString || !TABLE_CONFIG[tableName]?.allowCreate || !SAMPLE_DATA[tableName]) {
        console.log(`⏭️  Skipping ${mutationName} (not configured or no sample data)`);
        continue;
      }

      try {
        console.log(`➕ Testing ${mutationName}...`);
        
        const envUrls = {
          dev: process.env.VITE_DEV_GRAPHQL_URL,
          test: process.env.VITE_TEST_GRAPHQL_URL,
          uat: process.env.VITE_UAT_GRAPHQL_URL,
          live: process.env.VITE_LIVE_GRAPHQL_URL
        };
        
        // Resolve foreign keys with created record IDs or fetch from database
        let inputData = { ...SAMPLE_DATA[tableName] };
        
        // Get real IDs from database for foreign keys
        if (tableName === 'REDIRECT_URL') {
          // Get first available ORIGIN_PRODUCT_ID
          const productQuery = await fetch(envUrls[targetEnvironment], {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': await getAuthToken() },
            body: JSON.stringify({ query: 'query { listORIGIN_PRODUCTS { items { ORIGIN_PRODUCT_ID } } }' })
          }).then(res => res.json());
          if (productQuery.data?.listORIGIN_PRODUCTS?.items?.[0]) {
            inputData.ORIGIN_PRODUCT_ID = productQuery.data.listORIGIN_PRODUCTS.items[0].ORIGIN_PRODUCT_ID;
          }
        }
        
        if (tableName === 'SERVICE_PARAM' || tableName === 'STEP_SERVICE_MAPPING') {
          // Get first available SERVICE_ID
          const serviceQuery = await fetch(envUrls[targetEnvironment], {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': await getAuthToken() },
            body: JSON.stringify({ query: 'query { listSERVICES { items { SERVICE_ID } } }' })
          }).then(res => res.json());
          if (serviceQuery.data?.listSERVICES?.items?.[0]) {
            inputData.SERVICE_ID = serviceQuery.data.listSERVICES.items[0].SERVICE_ID;
          }
        }
        
        if (tableName === 'STEP_SERVICE_MAPPING') {
          // Get first available STEP_TYPE_ID
          const stepQuery = await fetch(envUrls[targetEnvironment], {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': await getAuthToken() },
            body: JSON.stringify({ query: 'query { listSTEP_TYPES { items { STEP_TYPE_ID } } }' })
          }).then(res => res.json());
          if (stepQuery.data?.listSTEP_TYPES?.items?.[0]) {
            inputData.STEP_TYPE_ID = stepQuery.data.listSTEP_TYPES.items[0].STEP_TYPE_ID;
          }
        }
        
        if (tableName === 'SERVICE_PARAM_MAPPING') {
          // Need at least 2 SERVICE_PARAM records
          const createdServiceParams = this.createdRecords.filter(r => r.tableName === 'SERVICE_PARAM');
          if (createdServiceParams.length >= 1) {
            // Use the created SERVICE_PARAM as source
            inputData.SOURCE_SERVICE_PARAM_ID = createdServiceParams[0].id;
            
            // Create a second SERVICE_PARAM for target if we don't have one
            if (createdServiceParams.length < 2) {
              const serviceId = this.createdRecords.find(r => r.tableName === 'SERVICE')?.id;
              if (serviceId) {
                const createParamMutation = mutations.createServiceParam;
                const paramData = {
                  SERVICE_ID: serviceId,
                  PARAM_NAME: `TARGET_PARAM_${timestamp}`,
                  CREATED_BY_USER_ID: 1,
                  CREATED_DATE: dateStr
                };
                
                const paramResult = await fetch(envUrls[targetEnvironment], {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'Authorization': await getAuthToken() },
                  body: JSON.stringify({ query: createParamMutation, variables: { input: paramData } })
                }).then(res => res.json());
                
                if (paramResult.data) {
                  const targetParamId = paramResult.data.createSERVICE_PARAM.SERVICE_PARAM_ID;
                  inputData.TARGET_SERVICE_PARAM_ID = targetParamId;
                  // Track this dynamically created record for deletion
                  this.createdRecords.push({ tableName: 'SERVICE_PARAM', id: targetParamId, idField: 'SERVICE_PARAM_ID' });
                  console.log(`Created second SERVICE_PARAM for target: ${targetParamId}`);
                }
              }
            } else {
              inputData.TARGET_SERVICE_PARAM_ID = createdServiceParams[1].id;
            }
            
            console.log(`Using SERVICE_PARAM IDs: ${inputData.SOURCE_SERVICE_PARAM_ID} (source) and ${inputData.TARGET_SERVICE_PARAM_ID} (target)`);
          }
        }
        
        if (tableName === 'SERVICE_EXPR_MAPPING' || tableName === 'STEP_TYPE_PARAM_MAP') {
          // Get first available SERVICE_PARAM_MAPPING_ID from database
          const mappingQuery = await fetch(envUrls[targetEnvironment], {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': await getAuthToken() },
            body: JSON.stringify({ query: 'query { listSERVICE_PARAM_MAPPINGS { items { SERVICE_PARAM_MAPPING_ID } } }' })
          }).then(res => res.json());
          if (mappingQuery.data?.listSERVICE_PARAM_MAPPINGS?.items?.[0]) {
            inputData.SERVICE_PARAM_MAPPING_ID = mappingQuery.data.listSERVICE_PARAM_MAPPINGS.items[0].SERVICE_PARAM_MAPPING_ID;
          }
        }
        
        // Resolve foreign keys with actual created record IDs
        Object.keys(inputData).forEach(field => {
          if (field.endsWith('_ID') && field !== `${tableName}_ID`) {
            let referencedTable = field.replace('_ID', '');
            
            // Handle special cases for SERVICE_PARAM references
            if (field === 'SOURCE_SERVICE_PARAM_ID' || field === 'TARGET_SERVICE_PARAM_ID') {
              referencedTable = 'SERVICE_PARAM';
            }
            
            const createdRecord = this.createdRecords.find(r => r.tableName === referencedTable);
            if (createdRecord && createdRecord.id) {
              inputData[field] = createdRecord.id;
              console.log(`Using ${referencedTable} ID: ${createdRecord.id} for ${field}`);
            } else if (inputData[field] === null || inputData[field] === 1) {
              console.log(`No created record found for ${referencedTable}`);
            }
          }
        });
        
        const endpoint = envUrls[targetEnvironment];
        const token = await getAuthToken();
        const result = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token
          },
          body: JSON.stringify({ query: mutationString, variables: { input: inputData } })
        }).then(res => res.json());
        
        if (result.errors) {
          throw new Error(result.errors[0].message);
        }
        
        const dataKey = Object.keys(result.data)[0];
        const createdRecord = result.data[dataKey];
        const idField = `${tableName}_ID`;
        const recordId = createdRecord[idField];
        
        // Use the placeholder ID returned by VTL template
        this.createdRecords.push({ tableName, id: recordId, idField });
        
        if (!recordId || recordId === null) {
          console.log(`⚠️  Warning: ${mutationName} returned null ID - check VTL template`);
        }
        
        console.log(`✅ ${mutationName} - Success (ID: ${recordId})`);
                this.results.mutations.passed++;
        this.results.mutations.details.push({ name: mutationName, status: 'PASS', id: recordId });
        
      } catch (error) {
        console.log(`❌ ${mutationName} - Failed: ${error.message}`);
        this.results.mutations.failed++;
        this.results.mutations.details.push({ name: mutationName, status: 'FAIL', error: error.message });
        this.results.mutations.failed++;
        this.results.mutations.details.push({ name: mutationName, status: 'FAIL', error: error.message });
      }
    }
  }

  async testUpdateMutations() {
    console.log('\n📝 Testing UPDATE mutations...\n');
    
    // Test updates for all created records (even with null IDs for debugging)
    console.log(`Testing updates for ${this.createdRecords.length} created records`);
    
    for (const record of this.createdRecords) {
      const mutationName = `update${this.toCamelCase(record.tableName)}`;
      const mutationString = mutations[mutationName];
      
      if (!mutationString || !TABLE_CONFIG[record.tableName]?.allowUpdate) {
        console.log(`⏭️  Skipping ${mutationName} (not configured)`);
        continue;
      }

      try {
        console.log(`✏️  Testing ${mutationName}...`);
        
        const updateData = {
          [record.idField]: record.id || 1 // Use 1 if ID is null for testing
        };
        
        // Only include non-foreign-key fields for update
        Object.keys(SAMPLE_DATA[record.tableName]).forEach(key => {
          // Skip foreign key fields (ending with _ID but not the primary key)
          if (key.endsWith('_ID') && key !== record.idField) {
            return;
          }
          updateData[key] = SAMPLE_DATA[record.tableName][key];
        });
        
        // Add "Updated" prefix to name fields with unique suffix
        Object.keys(updateData).forEach(key => {
          if (key.includes('NAME') && typeof updateData[key] === 'string') {
            updateData[key] = `Updated_${record.id}_${updateData[key]}`;
          }
        });
        
        const envUrls = {
          dev: process.env.VITE_DEV_GRAPHQL_URL,
          test: process.env.VITE_TEST_GRAPHQL_URL,
          uat: process.env.VITE_UAT_GRAPHQL_URL,
          live: process.env.VITE_LIVE_GRAPHQL_URL
        };
        
        const endpoint = envUrls[targetEnvironment];
        const token = await getAuthToken();
        const result = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token
          },
          body: JSON.stringify({ 
            query: mutationString, 
            variables: { input: updateData } 
          })
        }).then(res => res.json());
        
        if (result.errors) {
          throw new Error(result.errors[0].message);
        }
        
        const updatedRecord = result.data[Object.keys(result.data)[0]];

        
        console.log(`✅ ${mutationName} - Success (ID: ${record.id})`);

        
                this.results.mutations.passed++;
        this.results.mutations.details.push({ name: mutationName, status: 'PASS', id: record.id });
        
      } catch (error) {
        console.log(`❌ ${mutationName} - Failed: ${error.message}`);
        console.log(`\n   Query: \n  ${mutationString}\n`);
        this.results.mutations.failed++;
        this.results.mutations.details.push({ name: mutationName, status: 'FAIL', error: error.message });
      }
    }
  }

  async testDeleteMutations() {
    console.log('\n🗑️  Testing DELETE mutations (cleanup)...\n');
    
    // Delete in proper dependency order, but skip records that failed to create
    const deleteOrder = [
      // Level 4 dependencies (deepest children first)
      'SERVICE_EXPR_MAPPING', 'STEP_TYPE_PARAM_MAP',
      // Level 3 dependencies  
      'SERVICE_PARAM_MAPPING', 'STEP_SERVICE_MAPPING',
      // Level 2 dependencies
      'FILTER_CRITERIA', 'SORT_CRITERIA', 'SERVICE_PARAM',
      // Level 1 dependencies
      'SERVICE', 'REDIRECT_URL', 'SERVICE_DOMAIN',
      // Base tables (no dependencies)
      'STEP_TYPE', 'SERVICE_PROVIDER', 'ORIGIN_PRODUCT', 'CONFIG_PARAM'
    ];
    
    // Only delete records that were actually created successfully
    const successfullyCreated = this.createdRecords.filter(r => r.id && r.id !== null);
    
    console.log(`Testing deletes for ${successfullyCreated.length} successfully created records`);
    
    // Delete records in dependency order
    for (const tableName of deleteOrder) {
      const recordsToDelete = successfullyCreated.filter(r => r.tableName === tableName);
      
      for (const record of recordsToDelete) {
        const mutationName = `delete${this.toCamelCase(record.tableName)}`;
        const mutationString = mutations[mutationName];
        
        if (!mutationString || !TABLE_CONFIG[record.tableName]?.allowDelete) {
          console.log(`⏭️  Skipping ${mutationName} (not configured)`);
          continue;
        }

        try {
          console.log(`🗑️  Testing ${mutationName}...`);
          
          const envUrls = {
            dev: process.env.VITE_DEV_GRAPHQL_URL,
            test: process.env.VITE_TEST_GRAPHQL_URL,
            uat: process.env.VITE_UAT_GRAPHQL_URL,
            live: process.env.VITE_LIVE_GRAPHQL_URL
          };
          
          const endpoint = envUrls[targetEnvironment];
          const token = await getAuthToken();
          const result = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': token
            },
            body: JSON.stringify({ 
              query: mutationString, 
              variables: { input: { [record.idField]: record.id || 1 } }
            })
          }).then(res => res.json());
          
          if (result.errors) {
            throw new Error(result.errors[0].message);
          }
          
          console.log(`✅ ${mutationName} - Success (ID: ${record.id})`);
          this.results.mutations.passed++;
          this.results.mutations.details.push({ name: mutationName, status: 'PASS', id: record.id });
          
        } catch (error) {
          console.log(`❌ ${mutationName} - Failed: ${error.message}`);
          console.log(`   Query: \n  ${mutationString}\n`);
          console.log(`   Variables:`, JSON.stringify({ input: { [record.idField]: record.id || 1 } }, null, 2));
          this.results.mutations.failed++;
          this.results.mutations.details.push({ name: mutationName, status: 'FAIL', error: error.message });
        }
      }
    }
  }

  extractTableName(operationName) {
    // Handle table name extraction normally
    
    // Extract table name from operation names like 'listConfigParams' or 'createOriginProduct'
    const match = operationName.match(/(list|create|update|delete)([A-Z][a-zA-Z]*)/);
    if (!match) return null;
    
    const camelCase = match[2];
    // Convert camelCase to UPPER_SNAKE_CASE
    return camelCase.replace(/([A-Z])/g, '_$1').substring(1).toUpperCase();
  }

  toCamelCase(snakeCase) {
    return snakeCase.split('_').map((word, index) => 
      index === 0 ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() :
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join('');
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 LIVE GRAPHQL TEST SUMMARY');
    console.log('='.repeat(60));
    
    console.log(`\n🔍 QUERIES:`);
    console.log(`   ✅ Passed: ${this.results.queries.passed}`);
    console.log(`   ❌ Failed: ${this.results.queries.failed}`);
    
    console.log(`\n🔧 MUTATIONS:`);
    console.log(`   ✅ Passed: ${this.results.mutations.passed}`);
    console.log(`   ❌ Failed: ${this.results.mutations.failed}`);
    
    const totalPassed = this.results.queries.passed + this.results.mutations.passed;
    const totalFailed = this.results.queries.failed + this.results.mutations.failed;
    const total = totalPassed + totalFailed;
    
    console.log(`\n📈 OVERALL:`);
    console.log(`   Total Tests: ${total}`);
    console.log(`   Success Rate: ${total > 0 ? Math.round((totalPassed / total) * 100) : 0}%`);
    
    if (totalFailed > 0) {
      console.log(`\n❌ FAILED OPERATIONS:`);
      [...this.results.queries.details, ...this.results.mutations.details]
        .filter(detail => detail.status === 'FAIL')
        .forEach(detail => {
          console.log(`   • ${detail.name}: ${detail.error}`);
        });
    }
    
    console.log('\n' + '='.repeat(60));
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting Live GraphQL Test Suite');
  console.log(`📍 Environment: ${targetEnvironment}`);
  console.log('⚠️  Note: This requires valid AWS Cognito authentication');
  
  const tester = new LiveGraphQLTester();
  
  try {
    await tester.testQueries();
    await tester.testMutations();
  } catch (error) {
    console.error('💥 Test suite failed:', error.message);
    process.exit(1);
  }
  
  tester.printSummary();
}

// Handle authentication error gracefully
process.on('unhandledRejection', (reason) => {
  if (reason.message?.includes('Authentication not configured')) {
    console.log('\n⚠️  Authentication Setup Required:');
    console.log('   1. Configure AWS Cognito credentials');
    console.log('   2. Set environment variables for GraphQL endpoints');
    console.log('   3. Ensure you have valid authentication tokens');
    process.exit(0);
  }
  throw reason;
});

main();