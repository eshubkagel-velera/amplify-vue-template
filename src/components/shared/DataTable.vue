<template>
  <div class="table-container" @scroll="$emit('scroll', $event)">
    <table class="entity-table">
      <thead>
        <!-- Environment header for comparison mode -->
        <tr v-if="comparisonMode" class="environment-header">
          <th style="width: 200px;"></th>
          <th :colspan="fields.length" :class="comparisonMode === 'primary' ? 'primary-env-header' : 'compare-env-header'">
            {{ comparisonMode === 'primary' ? 'PRIMARY' : 'COMPARE' }}
          </th>
        </tr>
        <!-- Main header row -->
        <tr>
          <th v-if="!comparisonMode && showSelection" class="w-12">
            <input type="checkbox" @change="$emit('toggle-select-all')" :checked="allSelected" />
          </th>
          <th style="width: 200px;" :class="comparisonMode ? 'env-border-' + comparisonMode : ''">Actions</th>
          <th v-for="field in fields" :key="field" 
              class="resizable sortable" 
              :class="comparisonMode ? 'env-border-' + comparisonMode : ''"
              :data-field="field" 
              @click="$emit('sort', field)">
            {{ field }}
            <span v-if="sortField === field" class="sort-indicator">
              {{ sortDirection === 'asc' ? '↑' : '↓' }}
            </span>
            <div class="resize-handle" @mousedown="$emit('start-resize', $event, field)"></div>
          </th>
        </tr>
        <!-- Filter row -->
        <tr class="filter-row">
          <th v-if="!comparisonMode && showSelection"></th>
          <th>
            <button @click="$emit('clear-filters')" class="clear-filters-btn">Clear</button>
          </th>
          <th v-for="field in fields" :key="`filter-${field}`">
            <input 
              :value="filters[field] || ''"
              @input="$emit('update-filter', field, $event.target.value)"
              :placeholder="`Filter ${field}`"
              class="filter-input"
            />
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(entity, index) in data" :key="getEntityKey(entity, index)" :class="getRowClass(entity)">
          <td v-if="!comparisonMode && showSelection" class="text-center">
            <input 
              v-if="!entity.__isBlank"
              type="checkbox" 
              :value="getEntityId(entity)" 
              :checked="selectedItems.includes(getEntityId(entity))"
              @change="$emit('toggle-selection', getEntityId(entity))"
            />
          </td>
          <td style="width: 200px;" :class="comparisonMode ? 'env-border-' + comparisonMode : ''">
            <slot name="actions" :entity="entity" :index="index" />
          </td>
          <td v-for="field in fields" :key="field" :class="getCellClass(entity, field)">
            <slot name="cell" :entity="entity" :field="field" :value="entity[field]">
              <span v-if="!entity.__isBlank" class="read-only-text">
                {{ formatCellValue(entity[field], field, entity) }}
              </span>
              <span v-else class="blank-cell">—</span>
            </slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { formatDate } from '../../utils/dateUtils';

const props = defineProps({
  data: { type: Array, required: true },
  fields: { type: Array, required: true },
  filters: { type: Object, default: () => ({}) },
  sortField: { type: String, default: '' },
  sortDirection: { type: String, default: 'asc' },
  selectedItems: { type: Array, default: () => [] },
  allSelected: { type: Boolean, default: false },
  showSelection: { type: Boolean, default: true },
  comparisonMode: { type: String, default: null },
  fieldDifferences: { type: Map, default: () => new Map() },
  idField: { type: String, required: true }
});

defineEmits(['scroll', 'toggle-select-all', 'sort', 'start-resize', 'clear-filters', 'update-filter', 'toggle-selection']);

const getEntityId = (entity) => entity[props.idField];
const getEntityKey = (entity, index) => entity.__isBlank ? `blank-${index}` : getEntityId(entity);

const formatCellValue = (value, field, entity) => {
  if (field.includes('DATE')) return formatDate(value);
  
  // Check if there's a foreign key display value
  const displayField = `${field}_DISPLAY`;
  if (entity && entity[displayField]) {
    return entity[displayField];
  }
  
  return value;
};

const getRowClass = (entity) => {
  if (!props.comparisonMode || entity.__isBlank) return '';
  // Add comparison-specific row classes here
  return '';
};

const getCellClass = (entity, field) => {
  if (!props.fieldDifferences || !props.comparisonMode) return '';
  
  const entityId = getEntityId(entity);
  const diffInfo = props.fieldDifferences.get(entityId);
  
  if (diffInfo && diffInfo.differentFields.includes(field)) {
    return 'field-different';
  }
  
  return '';
};
</script>

<style scoped>
.table-container {
  height: calc(100vh - 400px);
  overflow: auto;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background-color: var(--bg-color);
}

.entity-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.entity-table th,
.entity-table td {
  border: 1px solid var(--border-color);
  padding: 8px;
  text-align: left;
  background-color: var(--bg-color);
  color: var(--text-color);
  height: 80px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: top;
}

.entity-table th {
  background-color: var(--table-header-bg);
  position: sticky;
  top: 0;
  z-index: 20;
  height: 45px;
  vertical-align: middle;
}

.filter-row th {
  background-color: var(--table-filter-bg);
  padding: 4px;
  position: sticky;
  top: 45px;
  z-index: 20;
  height: 35px;
}

.w-12 {
  width: 30px;
  max-width: 30px;
  min-width: 30px;
}

.text-center {
  text-align: center;
}

.filter-input {
  width: 100%;
  padding: 4px;
  font-size: 12px;
  border: 1px solid #ccc;
  border-radius: 3px;
}

.clear-filters-btn {
  padding: 4px 8px;
  font-size: 12px;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;
}

.resizable {
  position: relative;
  user-select: none;
}

.resize-handle {
  position: absolute;
  top: 0;
  right: 0;
  width: 5px;
  height: 100%;
  cursor: col-resize;
  background: transparent;
}

.resize-handle:hover {
  background: #007bff;
}

.sortable {
  cursor: pointer;
  user-select: none;
}

.sortable:hover {
  background-color: var(--table-filter-bg);
}

.sort-indicator {
  margin-left: 5px;
  font-weight: bold;
}

.read-only-text {
  display: block;
  width: 100%;
  padding: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
}

.blank-cell {
  color: var(--text-muted, #6c757d);
  font-style: italic;
  text-align: center;
  display: block;
  width: 100%;
}

.field-different {
  background-color: var(--diff-bg, rgba(255, 193, 7, 0.2)) !important;
  border-left: 3px solid var(--diff-border, #ffc107) !important;
}

.environment-header {
  background-color: var(--table-header-bg, #f8f9fa);
  font-weight: bold;
  text-align: center;
}

.primary-env-header {
  background-color: #e3f2fd;
  color: #1976d2;
  border: 2px solid #1976d2;
}

.compare-env-header {
  background-color: #fff3e0;
  color: #f57c00;
  border: 2px solid #f57c00;
}

.env-border-primary {
  border-right: 3px solid #1976d2 !important;
}

.env-border-compare {
  border-left: 3px solid #f57c00 !important;
}
</style>