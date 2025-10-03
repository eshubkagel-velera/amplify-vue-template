<template>
  <BaseModal
    :show="show"
    :title="`Mappings for Parameter: ${paramName}`"
    confirm-text="Close"
    :show-actions="false"
    class="mappings-modal"
    @confirm="$emit('close')"
  >
    <div v-if="mappings.length > 0" class="table-container">
      <table class="entity-table">
        <thead>
          <tr>
            <th>Mapping ID</th>
            <th>PSCU Client ID</th>
            <th>Product ID</th>
            <th>Source Service</th>
            <th>Target Service</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="mapping in mappings" :key="mapping.SERVICE_PARAM_MAPPING_ID">
            <td>{{ mapping.SERVICE_PARAM_MAPPING_ID }}</td>
            <td>{{ mapping.PSCU_CLIENT_ID }}</td>
            <td>{{ mapping.PRODUCT_ID }}</td>
            <td>{{ mapping.SOURCE_SERVICE }}</td>
            <td>{{ mapping.TARGET_SERVICE }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-else>No mappings found for this parameter.</p>
    
    <template #actions>
      <button @click="$emit('close')" class="btn-primary">Close</button>
    </template>
  </BaseModal>
</template>

<script setup>
import BaseModal from './BaseModal.vue';

defineProps({
  show: Boolean,
  paramName: String,
  mappings: Array
});

defineEmits(['close']);
</script>

<style scoped>
.mappings-modal {
  min-width: 800px;
  max-width: 90vw;
}

.table-container {
  max-height: 400px;
  margin-bottom: 20px;
  overflow: auto;
  border: 1px solid var(--border-color);
  border-radius: 4px;
}

.entity-table {
  width: 100%;
  border-collapse: collapse;
}

.entity-table th,
.entity-table td {
  border: 1px solid var(--border-color);
  padding: 8px;
  text-align: left;
}

.entity-table th {
  background-color: var(--table-header-bg);
  position: sticky;
  top: 0;
}
</style>