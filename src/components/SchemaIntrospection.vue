<template>
  <div class="component-container">
    <div class="header-row">
      <h2>GraphQL Schema Introspection</h2>

    </div>
    
    <div class="bordered-section">
      <div class="action-buttons">
        <button @click="getSchemaInfo" class="btn-primary" :disabled="loading">
          {{ loading ? 'Loading...' : 'Get Schema Info' }}
        </button>
        <button @click="clearResults" class="btn-secondary">Clear</button>
      </div>
    </div>

    <div v-if="error" class="error-message">
      <h3>Error:</h3>
      <pre>{{ error }}</pre>
    </div>

    <div v-if="schemaTypes.length > 0" class="results">
      <div class="bordered-section">
        <h3>Available Tables/Models ({{ schemaTypes.length }}):</h3>
        
        <div class="table-list">
          <div v-for="type in schemaTypes" :key="type.name" class="table-item">
            <h4 @click="toggleTable(type.name)" class="table-name">
              {{ type.name }} 
              <span class="toggle-icon">{{ expandedTables[type.name] ? '▼' : '▶' }}</span>
            </h4>
            
            <div v-if="expandedTables[type.name]" class="table-details">
              <p v-if="type.description" class="description">{{ type.description }}</p>
              <div class="fields">
                <h5>Fields ({{ type.fields.length }}):</h5>
                <div v-for="field in type.fields" :key="field.name" class="field-item">
                  <strong>{{ field.name }}</strong>: 
                  <span class="field-type">{{ getFieldType(field.type) }}</span>
                  <span v-if="field.description" class="field-description"> - {{ field.description }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="rawSchema" class="bordered-section">
      <h3>Raw Schema Data:</h3>
      <button @click="showRaw = !showRaw" class="btn-secondary">
        {{ showRaw ? 'Hide' : 'Show' }} Raw JSON
      </button>
      <pre v-if="showRaw" class="raw-json">{{ JSON.stringify(rawSchema, null, 2) }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import '../styles/shared.css';
import { ref } from 'vue';
import { generateClient } from 'aws-amplify/api';
import { introspectionQuery } from '../graphql/queries';

import { useErrorHandler } from '../composables/useErrorHandler';

interface SchemaType {
  name: string;
  kind: string;
  description?: string;
  fields: SchemaField[];
}

interface SchemaField {
  name: string;
  type: FieldType;
  description?: string;
}

interface FieldType {
  name?: string;
  kind: string;
  ofType?: FieldType;
}



const loading = ref(false);
const { error, handleError, clearError } = useErrorHandler();
const schemaTypes = ref<SchemaType[]>([]);
const rawSchema = ref(null);
const showRaw = ref(false);
const expandedTables = ref({});

const getSchemaInfo = async () => {
  loading.value = true;
  error.value = '';
  schemaTypes.value = [];
  rawSchema.value = null;
  
  try {
    const result = await generateClient().graphql({ query: introspectionQuery });
    rawSchema.value = result.data.__schema;
    
    // Filter to get only model types (tables)
    const modelTypes = result.data.__schema.types.filter(type => 
      type.kind === 'OBJECT' && 
      !type.name.startsWith('__') && 
      !type.name.startsWith('Table') &&
      !type.name.startsWith('Create') &&
      !type.name.startsWith('Update') &&
      !type.name.startsWith('Delete') &&
      !type.name.includes('Connection') &&
      !type.name.includes('Edge') &&
      type.fields && 
      type.fields.length > 0
    );
    
    schemaTypes.value = modelTypes.sort((a, b) => a.name.localeCompare(b.name));
    console.log('Schema Types:', schemaTypes.value);
    
  } catch (err) {
    handleError(err, 'schema introspection');
    console.error('Introspection error:', err);
  } finally {
    loading.value = false;
  }
};

const toggleTable = (tableName) => {
  expandedTables.value[tableName] = !expandedTables.value[tableName];
};

const getFieldType = (type) => {
  if (type.ofType) {
    return `${type.kind === 'NON_NULL' ? '' : '?'}${getFieldType(type.ofType)}${type.kind === 'LIST' ? '[]' : ''}`;
  }
  return type.name || type.kind;
};

const clearResults = () => {
  schemaTypes.value = [];
  rawSchema.value = null;
  clearError();
  expandedTables.value = {};
  showRaw.value = false;
};
</script>

<style scoped>
.error-message {
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
  padding: 15px;
  margin-bottom: 20px;
}

.error-message pre {
  margin: 0;
  white-space: pre-wrap;
}

.table-list {
  border: none;
}

.table-item {
  border-bottom: 1px solid var(--border-color);
}

.table-item:last-child {
  border-bottom: none;
}

.table-name {
  background: var(--table-header-bg);
  padding: 15px;
  margin: 0;
  cursor: pointer;
  user-select: none;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: var(--text-color);
}

.table-name:hover {
  background: var(--table-filter-bg);
}

.toggle-icon {
  font-size: 12px;
}

.table-details {
  padding: 15px;
  background: var(--bg-color);
  color: var(--text-color);
}

.description {
  font-style: italic;
  color: #666;
  margin-bottom: 15px;
}

.fields h5 {
  margin: 0 0 10px 0;
  color: #495057;
}

.field-item {
  padding: 5px 0;
  border-bottom: 1px solid var(--border-color);
}

.field-item:last-child {
  border-bottom: none;
}

.field-type {
  color: #007bff;
  font-family: monospace;
}

.field-description {
  color: #666;
  font-style: italic;
}

.raw-schema {
  margin-top: 30px;
}



.raw-json {
  background: var(--input-bg);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 15px;
  max-height: 400px;
  overflow: auto;
  font-size: 12px;
  color: var(--text-color);
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

@media (max-width: 768px) {
  .header-row {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }
}
</style>
