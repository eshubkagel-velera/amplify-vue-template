<template>
  <BaseModal
    :show="show"
    :title="`Copy Differences to ${targetEnvironment?.toUpperCase()}`"
    confirm-text="Yes, Copy These Changes"
    confirm-class="btn-warning"
    @confirm="$emit('confirm')"
    @cancel="$emit('cancel')"
  >
    <p>The following fields will be updated in the matching record in {{ targetEnvironment?.toUpperCase() }}:</p>
    <div v-if="entity" class="differences-preview">
      <div v-for="field in differentFields" :key="field" class="field-update">
        <strong>{{ field }}:</strong> {{ entity[field] }}
      </div>
    </div>
  </BaseModal>
</template>

<script setup>
import BaseModal from './BaseModal.vue';

defineProps({
  show: Boolean,
  entity: Object,
  targetEnvironment: String,
  differentFields: Array
});

defineEmits(['confirm', 'cancel']);
</script>

<style scoped>
.differences-preview {
  margin: 15px 0;
  padding: 15px;
  background: var(--bg-color, #f8f9fa);
  border-radius: 4px;
  border: 1px solid var(--border-color, #dee2e6);
}

.field-update {
  margin: 8px 0;
  padding: 5px;
  font-family: monospace;
}

.btn-warning {
  background: #ffc107;
  color: #212529;
  border: none;
  border-radius: 4px;
  padding: 8px 12px;
  cursor: pointer;
  margin-right: 10px;
}

.btn-warning:hover {
  background: #e0a800;
}
</style>