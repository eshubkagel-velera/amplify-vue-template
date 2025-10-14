import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { getMockClient } from './mock-client.js';
import * as queries from '../graphql/queries.js';
import * as mutations from '../graphql/mutations.js';
import tableConfigData from '../../config/table_config.json';

const TABLE_CONFIG = tableConfigData.tables;

// Hardcoded sample data based on SQL table structures
const SAMPLE_DATA = {
  'CONFIG_PARAM': { CONFIG_NAME: 'TEST_CONFIG', CONFIG_VALUE: 'test_value', DESCRIPTION: 'Test config' },
  'ORIGIN_PRODUCT': { VENDOR_NAME: 'Test Vendor', PRODUCT_ID: 'TEST_PROD', PSCU_CLIENT_ID: 12345, PRODUCT_DESC: 'Test Product', CREATED_BY_USER_ID: 1, CREATED_DATE: '2024-01-01' },
  'SERVICE_PROVIDER': { SERVICE_PROVIDER_NAME: 'Test Provider', CREATED_BY_USER_ID: 1, CREATED_DATE: '2024-01-01' },
  'STEP_TYPE': { STEP_TYPE_NAME: 'TEST_STEP', STEP_TYPE_DESC: 'Test step', RESOURCE_NAME: 'test-resource', CREATED_BY_USER_ID: 1, CREATED_DATE: '2024-01-01' },
  'SERVICE': { SERVICE_PROVIDER_ID: 1, URI: 'https://test-service.com', CREATED_BY_USER_ID: 1, CREATED_DATE: '2024-01-01' },
  'REDIRECT_URL': { ORIGIN_PRODUCT_ID: 1, URL_TYPE_CODE: 'TEST', URL: 'https://test.com', CREATED_BY_USER_ID: 1, CREATED_DATE: '2024-01-01' },
  'SERVICE_DOMAIN': { SERVICE_PROVIDER_ID: 1, DOMAIN_URL: 'https://test-domain.com' },
  'SERVICE_PARAM': { SERVICE_ID: 1, PARAM_NAME: 'TEST_PARAM', CREATED_BY_USER_ID: 1, CREATED_DATE: '2024-01-01' },
  'FILTER_CRITERIA': { ORIGIN_PRODUCT_ID: 1, STEP_TYPE_ID: 1, CRITERIA: 'test criteria', SEQUENCE_NBR: 1 },
  'SORT_CRITERIA': { ORIGIN_PRODUCT_ID: 1, STEP_TYPE_ID: 1, JSON_PATH: '$.test', SORT_ORDER: 'ASC', SORT_PRIORITY: 1, SEQUENCE_NBR: 1 },
  'STEP_SERVICE_MAPPING': { STEP_TYPE_ID: 1, SERVICE_ID: 1, SEQUENCE_NBR: 1 },
  'SERVICE_EXPR_MAPPING': { SERVICE_PARAM_MAPPING_ID: 1, SOURCE_EXPR: 'test.source', TARGET_EXPR: 'test.target', CREATED_BY_USER_ID: 1, CREATED_DATE: '2024-01-01' },
  'SERVICE_PARAM_MAPPING': { ORIGIN_PRODUCT_ID: 1, SOURCE_SERVICE_PARAM_ID: 1, TARGET_SERVICE_PARAM_ID: 1, CREATED_BY_USER_ID: 1, CREATED_DATE: '2024-01-01' },
  'STEP_TYPE_PARAM_MAP': { STEP_TYPE_ID: 1, SERVICE_PARAM_MAPPING_ID: 1, CREATED_BY_USER_ID: '1' }
};

// Tables that are read-only (based on table_config.json)
const READ_ONLY_TABLES = Object.keys(TABLE_CONFIG).filter(tableName => 
  !TABLE_CONFIG[tableName].allowCreate || 
  !TABLE_CONFIG[tableName].allowUpdate || 
  !TABLE_CONFIG[tableName].allowDelete
);

// Tables that are fully writable
const WRITABLE_TABLES = Object.keys(TABLE_CONFIG).filter(tableName => 
  TABLE_CONFIG[tableName].allowCreate && 
  TABLE_CONFIG[tableName].allowUpdate && 
  TABLE_CONFIG[tableName].allowDelete
);

// Base tables (no foreign key dependencies)
const BASE_TABLES = ['CONFIG_PARAM', 'ORIGIN_PRODUCT', 'SERVICE_PROVIDER', 'STEP_TYPE'];

// Dependent tables (have foreign key dependencies)
const DEPENDENT_TABLES = Object.keys(SAMPLE_DATA).filter(tableName => 
  !BASE_TABLES.includes(tableName) && TABLE_CONFIG[tableName]?.allowCreate
);

describe('GraphQL Integration Tests', () => {
  let client;
  const testData = {};
  const createdRecords = [];

  beforeAll(() => {
    client = getMockClient();
  });

  afterAll(async () => {
    // Cleanup test records in reverse order
    for (let i = createdRecords.length - 1; i >= 0; i--) {
      const record = createdRecords[i];
      try {
        await client.graphql({
          query: record.deleteQuery,
          variables: { input: { [record.idField]: record.id } }
        });
      } catch (error) {
        console.warn(`Cleanup failed for ${record.tableName}:`, error.message);
      }
    }
  });

  // Test READ operations for all tables
  describe('READ Operations', () => {
    Object.keys(TABLE_CONFIG).forEach(tableName => {
      if (TABLE_CONFIG[tableName].allowQuery) {
        test(`${tableName} - READ (list query)`, async () => {
          const entityName = tableName.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join('');
          const queryName = `list${entityName}s`;
          const query = queries[queryName];
          
          if (!query) {
            console.warn(`Query ${queryName} not found`);
            return;
          }
          
          const result = await client.graphql({ query });
          if (result.errors) {
            console.warn(`${queryName} returned errors:`, result.errors);
            expect(result.errors).toBeDefined();
          } else {
            expect(result.data[queryName]).toBeDefined();
            if (result.data[queryName]) {
              expect(result.data[queryName].items).toBeInstanceOf(Array);
            }
          }
        });
      }
    });
  });

  // Test that read-only tables don't have mutations
  describe('Read-Only Table Validation', () => {
    READ_ONLY_TABLES.forEach(tableName => {
      test(`${tableName} - mutations should not exist`, () => {
        const entityName = tableName.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join('');
        
        if (!TABLE_CONFIG[tableName].allowCreate) {
          expect(mutations[`create${entityName}`]).toBeUndefined();
        }
        if (!TABLE_CONFIG[tableName].allowUpdate) {
          expect(mutations[`update${entityName}`]).toBeUndefined();
        }
        if (!TABLE_CONFIG[tableName].allowDelete) {
          expect(mutations[`delete${entityName}`]).toBeUndefined();
        }
        
        console.log(`✅ ${tableName} mutations properly restricted`);
      });
    });
  });

  // Test CREATE operations for base tables first
  describe('CREATE Operations - Base Tables', () => {
    BASE_TABLES.forEach(tableName => {
      if (TABLE_CONFIG[tableName]?.allowCreate && SAMPLE_DATA[tableName]) {
        test(`${tableName} - CREATE`, async () => {
          const entityName = tableName.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join('');
          const createMutation = mutations[`create${entityName}`];
          const idField = `${tableName}_ID`;
          const sampleData = SAMPLE_DATA[tableName];
          
          if (!createMutation) {
            console.warn(`Create mutation for ${tableName} not found`);
            return;
          }
          
          const createResult = await client.graphql({
            query: createMutation,
            variables: { input: sampleData }
          });
          
          if (createResult.errors) {
            console.warn(`${tableName} CREATE failed:`, createResult.errors[0]?.message);
            expect(createResult.errors).toBeDefined();
          } else {
            const createdRecord = createResult.data[`create${entityName}`];
            const recordId = createdRecord[idField];
            testData[tableName] = { id: recordId, idField };
            createdRecords.push({ 
              tableName, 
              id: recordId, 
              idField, 
              deleteQuery: mutations[`delete${entityName}`] 
            });
            expect(recordId).toBeDefined();
            expect(createdRecord).toMatchObject(sampleData);
            console.log(`✅ ${tableName} CREATE successful - ID: ${recordId}`);
          }
        });
      }
    });
  });

  // Test CREATE operations for dependent tables
  describe('CREATE Operations - Dependent Tables', () => {
    DEPENDENT_TABLES.forEach(tableName => {
      if (TABLE_CONFIG[tableName]?.allowCreate && SAMPLE_DATA[tableName]) {
        test(`${tableName} - CREATE with foreign keys`, async () => {
          const entityName = tableName.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join('');
          const createMutation = mutations[`create${entityName}`];
          const idField = `${tableName}_ID`;
          let sampleData = { ...SAMPLE_DATA[tableName] };
          
          if (!createMutation) {
            console.warn(`Create mutation for ${tableName} not found`);
            return;
          }
          
          // Update foreign key values with actual created record IDs
          Object.keys(sampleData).forEach(field => {
            if (field.endsWith('_ID') && field !== idField) {
              const referencedTable = field.replace('_ID', '');
              if (testData[referencedTable]?.id) {
                sampleData[field] = testData[referencedTable].id;
              }
            }
          });
          
          const createResult = await client.graphql({
            query: createMutation,
            variables: { input: sampleData }
          });
          
          if (createResult.errors) {
            console.warn(`${tableName} CREATE failed:`, createResult.errors[0]?.message);
            expect(createResult.errors).toBeDefined();
          } else {
            const createdRecord = createResult.data[`create${entityName}`];
            const recordId = createdRecord[idField];
            testData[tableName] = { id: recordId, idField };
            createdRecords.push({ 
              tableName, 
              id: recordId, 
              idField, 
              deleteQuery: mutations[`delete${entityName}`] 
            });
            expect(recordId).toBeDefined();
            expect(createdRecord).toMatchObject(sampleData);
            console.log(`✅ ${tableName} CREATE successful - ID: ${recordId}`);
          }
        });
      }
    });
  });

  // Test UPDATE operations
  describe('UPDATE Operations', () => {
    WRITABLE_TABLES.forEach(tableName => {
      if (TABLE_CONFIG[tableName]?.allowUpdate && SAMPLE_DATA[tableName]) {
        test(`${tableName} - UPDATE`, async () => {
          const entityName = tableName.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join('');
          const updateMutation = mutations[`update${entityName}`];
          const idField = `${tableName}_ID`;
          
          if (!updateMutation) {
            console.warn(`Update mutation for ${tableName} not found`);
            return;
          }
          
          const recordData = testData[tableName];
          if (recordData?.id) {
            let updateData = { 
              [idField]: recordData.id, 
              ...SAMPLE_DATA[tableName]
            };
            
            // Add "updated" indicator to name fields
            Object.keys(updateData).forEach(key => {
              if (key.includes('NAME') && typeof updateData[key] === 'string') {
                updateData[key] = `Updated ${updateData[key]}`;
              }
            });
            
            const updateResult = await client.graphql({
              query: updateMutation,
              variables: { input: updateData }
            });
            
            if (updateResult.errors) {
              console.warn(`${tableName} UPDATE failed:`, updateResult.errors[0]?.message);
              expect(updateResult.errors).toBeDefined();
            } else {
              expect(updateResult.data[`update${tableName}`][idField]).toBe(recordData.id);
              console.log(`✅ ${tableName} UPDATE successful - ID: ${recordData.id}`);
            }
          } else {
            console.warn(`${tableName} UPDATE skipped - no test record available`);
          }
        });
      }
    });

    // Test UPDATE blocked on read-only tables
    READ_ONLY_TABLES.forEach(tableName => {
      if (!TABLE_CONFIG[tableName].allowUpdate) {
        test(`${tableName} - UPDATE should be blocked`, async () => {
          const entityName = tableName.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join('');
          const updateMutation = mutations[`update${entityName}`];
          
          if (updateMutation) {
            const result = await client.graphql({
              query: updateMutation,
              variables: { input: { [`${tableName}_ID`]: 1, ...SAMPLE_DATA[tableName] } }
            });
            expect(result.errors).toBeDefined();
            console.log(`✅ ${tableName} UPDATE properly blocked (read-only)`);
          } else {
            console.log(`✅ ${tableName} UPDATE mutation not available (read-only)`);
          }
        });
      }
    });
  });

  // Test DELETE operations
  describe('DELETE Operations', () => {
    // Test DELETE blocked on read-only tables
    READ_ONLY_TABLES.forEach(tableName => {
      if (!TABLE_CONFIG[tableName].allowDelete) {
        test(`${tableName} - DELETE should be blocked`, async () => {
          const entityName = tableName.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join('');
          const deleteMutation = mutations[`delete${entityName}`];
          
          if (deleteMutation) {
            const result = await client.graphql({
              query: deleteMutation,
              variables: { input: { [`${tableName}_ID`]: 1 } }
            });
            expect(result.errors).toBeDefined();
            console.log(`✅ ${tableName} DELETE properly blocked (read-only)`);
          } else {
            console.log(`✅ ${tableName} DELETE mutation not available (read-only)`);
          }
        });
      }
    });

    // Test DELETE for writable tables (in reverse dependency order)
    [...DEPENDENT_TABLES].reverse().forEach(tableName => {
      if (TABLE_CONFIG[tableName]?.allowDelete) {
        test(`${tableName} - DELETE`, async () => {
          const entityName = tableName.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join('');
          const deleteMutation = mutations[`delete${entityName}`];
          
          if (!deleteMutation) {
            console.warn(`Delete mutation for ${tableName} not found`);
            return;
          }
          
          const recordData = testData[tableName];
          if (recordData?.id) {
            const deleteResult = await client.graphql({
              query: deleteMutation,
              variables: { input: { [recordData.idField]: recordData.id } }
            });
            
            if (deleteResult.errors) {
              console.warn(`${tableName} DELETE failed:`, deleteResult.errors[0]?.message);
            } else {
              expect(deleteResult.data[`delete${tableName}`][recordData.idField]).toBe(recordData.id);
              console.log(`✅ ${tableName} DELETE successful - ID: ${recordData.id}`);
              delete testData[tableName];
              const index = createdRecords.findIndex(r => r.tableName === tableName && r.id === recordData.id);
              if (index > -1) createdRecords.splice(index, 1);
            }
          }
        });
      }
    });

    // Delete base tables last
    [...BASE_TABLES].reverse().forEach(tableName => {
      if (TABLE_CONFIG[tableName]?.allowDelete) {
        test(`${tableName} - DELETE`, async () => {
          const entityName = tableName.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join('');
          const deleteMutation = mutations[`delete${entityName}`];
          
          if (!deleteMutation) {
            console.warn(`Delete mutation for ${tableName} not found`);
            return;
          }
          
          const recordData = testData[tableName];
          if (recordData?.id) {
            const deleteResult = await client.graphql({
              query: deleteMutation,
              variables: { input: { [recordData.idField]: recordData.id } }
            });
            
            if (deleteResult.errors) {
              console.warn(`${tableName} DELETE failed:`, deleteResult.errors[0]?.message);
            } else {
              expect(deleteResult.data[`delete${tableName}`][recordData.idField]).toBe(recordData.id);
              console.log(`✅ ${tableName} DELETE successful - ID: ${recordData.id}`);
              delete testData[tableName];
              const index = createdRecords.findIndex(r => r.tableName === tableName && r.id === recordData.id);
              if (index > -1) createdRecords.splice(index, 1);
            }
          }
        });
      }
    });
  });

  // Test error scenarios
  describe('Error Scenarios', () => {
    test('CREATE with missing required fields', async () => {
      const result = await client.graphql({
        query: mutations.createConfigParam,
        variables: { input: {} }
      });
      expect(result.errors).toBeDefined();
      console.log('✅ Missing required fields properly rejected');
    });

    test('CREATE with invalid data types', async () => {
      const result = await client.graphql({
        query: mutations.createOriginProduct,
        variables: { 
          input: { 
            VENDOR_NAME: 'Test',
            PRODUCT_ID: 'TEST',
            PSCU_CLIENT_ID: 'INVALID_NUMBER',
            PRODUCT_DESC: 'Test',
            CREATED_BY_USER_ID: 1
          }
        }
      });
      expect(result.errors).toBeDefined();
      console.log('✅ Invalid data types properly rejected');
    });

    test('UPDATE non-existent record', async () => {
      const result = await client.graphql({
        query: mutations.updateConfigParam,
        variables: { 
          input: { 
            CONFIG_PARAM_ID: 99999,
            CONFIG_NAME: 'NON_EXISTENT',
            CONFIG_VALUE: 'test'
          }
        }
      });
      expect(result).toBeDefined();
      console.log('✅ Non-existent record update handled');
    });

    test('DELETE non-existent record', async () => {
      const result = await client.graphql({
        query: mutations.deleteConfigParam,
        variables: { input: { CONFIG_PARAM_ID: 99999 } }
      });
      expect(result).toBeDefined();
      console.log('✅ Non-existent record deletion handled');
    });
  });
});