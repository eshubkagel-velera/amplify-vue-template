<template>
  <div class="button-container">
    <!-- Edit/View Button -->
    <button 
      v-if="!entity.__isBlank" 
      @click="$emit('edit', entity)" 
      class="btn-primary"
    >
      {{ readonly ? 'View' : (copyOnEditWithMappings && mappingCount > 0) ? 'Copy & Edit' : 'Edit' }}
    </button>

    <!-- Comparison Mode Buttons -->
    <template v-if="comparisonMode">
      <button 
        v-if="canAddToOther && !isMatched" 
        @click="$emit('addToOther', entity)" 
        class="btn-success"
      >
        Add to {{ otherEnvironment }}
      </button>
      <button 
        v-if="canAddToOther && isMatched && hasDifferences" 
        @click="$emit('copyDifferences', entity)" 
        class="btn-warning"
      >
        Copy to {{ otherEnvironment }}
      </button>
    </template>

    <!-- Entity-Specific Action Buttons -->
    <template v-if="!hideRowActions">
      <!-- SERVICE_PARAM specific -->
      <button 
        v-if="entityName === 'SERVICE_PARAM' && mappingCount > 0" 
        @click="$emit('showMappings', entity)" 
        class="btn-primary"
      >
        Mappings ({{ mappingCount }})
      </button>

      <!-- ORIGIN_PRODUCT specific -->
      <template v-if="entityName === 'ORIGIN_PRODUCT'">
        <button @click="$emit('openMapping', entity)" class="btn-primary">
          Mapping
        </button>
        <button @click="$emit('openRedirectUrls', entity)" class="btn-primary">
          Redirect URLs
        </button>
      </template>

      <!-- STEP_TYPE specific -->
      <button 
        v-if="entityName === 'STEP_TYPE'" 
        @click="$emit('openStepServices', entity)" 
        class="btn-primary"
      >
        Edit Services
      </button>

      <!-- SERVICE specific -->
      <template v-if="entityName === 'SERVICE'">
        <button @click="$emit('openServiceParams', entity)" class="btn-primary">
          Parameters
        </button>
        <button @click="$emit('openServiceStepMapping', entity)" class="btn-primary">
          Step Mappings
        </button>
      </template>
    </template>
  </div>
</template>

<script setup>
const props = defineProps({
  entity: { type: Object, required: true },
  entityName: { type: String, required: true },
  readonly: { type: Boolean, default: false },
  comparisonMode: { type: String, default: null },
  hideRowActions: { type: Boolean, default: false },
  canAddToOther: { type: Boolean, default: false },
  otherEnvironment: { type: String, default: '' },
  isMatched: { type: Boolean, default: false },
  hasDifferences: { type: Boolean, default: false },
  mappingCount: { type: Number, default: 0 },
  copyOnEditWithMappings: { type: Boolean, default: false }
});

defineEmits([
  'edit', 
  'addToOther', 
  'copyDifferences', 
  'showMappings', 
  'openMapping', 
  'openRedirectUrls', 
  'openStepServices', 
  'openServiceParams', 
  'openServiceStepMapping'
]);
</script>

<style scoped>
.button-container {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  align-items: flex-start;
  max-width: 200px;
}

.button-container button {
  margin: 0;
  flex-shrink: 1;
  font-size: 12px;
  padding: 4px 6px;
  min-width: 0;
  cursor: pointer;
  border: none;
  border-radius: 4px;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-success {
  background: #28a745;
  color: white;
}

.btn-warning {
  background: #ffc107;
  color: #212529;
}
</style>