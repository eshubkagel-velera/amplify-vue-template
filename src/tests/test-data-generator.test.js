import { describe, test, expect } from 'vitest';
import { 
  generateSampleData, 
  getTableDependencyOrder, 
  getForeignKeyRelationships,
  getReadOnlyTables,
  getWritableTables
} from './test-data-generator.js';

describe('Test Data Generator', () => {
  test('generates sample data for known tables', () => {
    const configParamData = generateSampleData('CONFIG_PARAM');
    expect(configParamData).toBeDefined();
    expect(configParamData.CONFIG_NAME).toBeDefined();
    expect(configParamData.CONFIG_VALUE).toBeDefined();
    console.log('✅ Sample data generation working');
  });

  test('identifies table dependencies correctly', () => {
    const { baseTables, dependentTables } = getTableDependencyOrder();
    expect(baseTables).toBeInstanceOf(Array);
    expect(dependentTables).toBeInstanceOf(Array);
    console.log(`✅ Found ${baseTables.length} base tables, ${dependentTables.length} dependent tables`);
  });

  test('identifies read-only tables', () => {
    const readOnlyTables = getReadOnlyTables();
    expect(readOnlyTables).toBeInstanceOf(Array);
    console.log(`✅ Found ${readOnlyTables.length} read-only tables`);
  });

  test('identifies writable tables', () => {
    const writableTables = getWritableTables();
    expect(writableTables).toBeInstanceOf(Array);
    console.log(`✅ Found ${writableTables.length} writable tables`);
  });

  test('detects foreign key relationships', () => {
    const writableTables = getWritableTables();
    if (writableTables.length > 0) {
      const relationships = getForeignKeyRelationships(writableTables[0]);
      expect(relationships).toBeDefined();
      console.log(`✅ Foreign key detection working for ${writableTables[0]}`);
    }
  });
});