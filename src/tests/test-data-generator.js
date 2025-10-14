import tableConfigData from '../../config/table_config.json';

const TABLE_CONFIG = tableConfigData.tables;

// Generate sample data based on field type and name
function generateSampleValue(fieldName, tableName) {
  // Handle foreign keys
  if (fieldName.endsWith('_ID') && fieldName !== `${tableName}_ID`) {
    return 1; // Default foreign key value
  }
  
  // Handle specific field patterns
  if (fieldName.includes('DATE')) return '2024-01-01';
  if (fieldName.includes('FLAG')) return 'Y';
  if (fieldName.includes('NBR') || fieldName.includes('NUMBER')) return 1;
  if (fieldName.includes('EMAIL')) return 'test@example.com';
  if (fieldName.includes('URL')) return 'https://test.com';
  if (fieldName.includes('PHONE')) return '555-0123';
  if (fieldName.includes('ZIP')) return '12345';
  if (fieldName.includes('CLIENT_ID')) return 12345;
  if (fieldName.includes('NAME')) return `Test ${tableName.replace('_', ' ')}`;
  if (fieldName.includes('DESC')) return `Test ${tableName.replace('_', ' ')} Description`;
  if (fieldName.includes('CODE')) return 'TEST';
  if (fieldName.includes('CRITERIA')) return 'test criteria';
  if (fieldName.includes('PATH')) return '$.test';
  if (fieldName.includes('ORDER')) return 'ASC';
  if (fieldName.includes('PRIORITY')) return 1;
  if (fieldName.includes('SEQUENCE')) return 1;
  if (fieldName.includes('URI')) return 'https://test-service.com';
  if (fieldName.includes('RESOURCE')) return 'test-resource';
  if (fieldName.includes('EXPR')) return 'test.expr';
  
  return 'test_value';
}

// Generate sample data for a table using fallback patterns
export function generateSampleData(tableName) {
  const fallbacks = {
    'CONFIG_PARAM': { CONFIG_NAME: 'TEST_CONFIG', CONFIG_VALUE: 'test_value' },
    'ORIGIN_PRODUCT': { VENDOR_NAME: 'Test Vendor', PRODUCT_ID: 'TEST_PROD', PSCU_CLIENT_ID: 12345, PRODUCT_DESC: 'Test Product', CREATED_BY_USER_ID: 1, CREATED_DATE: '2024-01-01' },
    'SERVICE_PROVIDER': { SERVICE_PROVIDER_NAME: 'Test Provider', CREATED_BY_USER_ID: 1, CREATED_DATE: '2024-01-01' },
    'STEP_TYPE': { STEP_TYPE_NAME: 'TEST_STEP', RESOURCE_NAME: 'test-resource', CREATED_BY_USER_ID: 1, CREATED_DATE: '2024-01-01' },
    'SERVICE': { URI: 'https://test-service.com', CREATED_BY_USER_ID: 1, CREATED_DATE: '2024-01-01' },
    'REDIRECT_URL': { URL_TYPE_CODE: 'TEST', URL: 'https://test.com', CREATED_BY_USER_ID: 1, CREATED_DATE: '2024-01-01' },
    'SERVICE_DOMAIN': { DOMAIN_URL: 'https://test-domain.com' },
    'SERVICE_PARAM': { PARAM_NAME: 'TEST_PARAM', CREATED_BY_USER_ID: 1, CREATED_DATE: '2024-01-01' },
    'FILTER_CRITERIA': { CRITERIA: 'test criteria', SEQUENCE_NBR: 1 },
    'SORT_CRITERIA': { JSON_PATH: '$.test', SORT_ORDER: 'ASC', SORT_PRIORITY: 1, SEQUENCE_NBR: 1 },
    'STEP_SERVICE_MAPPING': { SEQUENCE_NBR: 1 },
    'SERVICE_EXPR_MAPPING': { SOURCE_EXPR: 'test.source', TARGET_EXPR: 'test.target', CREATED_BY_USER_ID: 1, CREATED_DATE: '2024-01-01' },
    'SERVICE_PARAM_MAPPING': { CREATED_BY_USER_ID: 1, CREATED_DATE: '2024-01-01' },
    'STEP_TYPE_PARAM_MAP': { CREATED_BY_USER_ID: '1' }
  };
  
  return fallbacks[tableName] || { NAME: `Test ${tableName}`, CREATED_BY_USER_ID: 1 };
}

// Generate foreign key dependent data
export function generateFKDependentData(tableName, foreignKeyValues) {
  const baseData = generateSampleData(tableName);
  
  // Override with provided foreign key values
  Object.entries(foreignKeyValues).forEach(([key, value]) => {
    baseData[key] = value;
  });
  
  return baseData;
}

// Get dependency order for tables (base tables first)
export function getTableDependencyOrder() {
  const baseTables = ['CONFIG_PARAM', 'ORIGIN_PRODUCT', 'SERVICE_PROVIDER', 'STEP_TYPE'];
  const dependentTables = Object.keys(TABLE_CONFIG).filter(tableName => 
    !baseTables.includes(tableName) && TABLE_CONFIG[tableName].allowCreate
  );
  
  return { baseTables: baseTables.filter(t => TABLE_CONFIG[t]?.allowCreate), dependentTables };
}

// Get foreign key relationships for a table
export function getForeignKeyRelationships(tableName) {
  const relationships = {};
  
  // Common foreign key patterns
  const fkPatterns = {
    'REDIRECT_URL': { ORIGIN_PRODUCT_ID: 'ORIGIN_PRODUCT' },
    'SERVICE': { SERVICE_PROVIDER_ID: 'SERVICE_PROVIDER' },
    'SERVICE_DOMAIN': { SERVICE_PROVIDER_ID: 'SERVICE_PROVIDER' },
    'SERVICE_PARAM': { SERVICE_ID: 'SERVICE' },
    'FILTER_CRITERIA': { ORIGIN_PRODUCT_ID: 'ORIGIN_PRODUCT', STEP_TYPE_ID: 'STEP_TYPE' },
    'SORT_CRITERIA': { ORIGIN_PRODUCT_ID: 'ORIGIN_PRODUCT', STEP_TYPE_ID: 'STEP_TYPE' },
    'STEP_SERVICE_MAPPING': { STEP_TYPE_ID: 'STEP_TYPE', SERVICE_ID: 'SERVICE' },
    'SERVICE_EXPR_MAPPING': { SERVICE_PARAM_MAPPING_ID: 'SERVICE_PARAM_MAPPING' },
    'SERVICE_PARAM_MAPPING': { ORIGIN_PRODUCT_ID: 'ORIGIN_PRODUCT', SOURCE_SERVICE_PARAM_ID: 'SERVICE_PARAM', TARGET_SERVICE_PARAM_ID: 'SERVICE_PARAM' },
    'STEP_TYPE_PARAM_MAP': { STEP_TYPE_ID: 'STEP_TYPE', SERVICE_PARAM_MAPPING_ID: 'SERVICE_PARAM_MAPPING' }
  };
  
  return fkPatterns[tableName] || {};
}

// Get read-only tables from configuration
export function getReadOnlyTables() {
  return Object.keys(TABLE_CONFIG).filter(tableName => 
    !TABLE_CONFIG[tableName].allowCreate || 
    !TABLE_CONFIG[tableName].allowUpdate || 
    !TABLE_CONFIG[tableName].allowDelete
  );
}

// Get writable tables from configuration
export function getWritableTables() {
  return Object.keys(TABLE_CONFIG).filter(tableName => 
    TABLE_CONFIG[tableName].allowCreate && 
    TABLE_CONFIG[tableName].allowUpdate && 
    TABLE_CONFIG[tableName].allowDelete
  );
}