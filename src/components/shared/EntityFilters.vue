<template>
  <div v-if="showFilters" class="filters-container">
    <!-- Service Filter -->
    <div v-if="entityName === 'SERVICE_PARAM'" class="filter-section">
      <label for="serviceFilter">Filter by Service:</label>
      <select id="serviceFilter" v-model="selectedService" @change="$emit('serviceChange', selectedService)">
        <option value="">-- Select a Service --</option>
        <option v-for="service in serviceOptions" :key="service.value" :value="service.value">
          {{ service.label }}
        </option>
      </select>
    </div>
    
    <!-- Product Filter -->
    <div v-if="entityName === 'REDIRECT_URL'" class="filter-section">
      <label for="productFilter">Filter by Product:</label>
      <select id="productFilter" v-model="selectedProduct" @change="$emit('productChange', selectedProduct)">
        <option value="">-- Select a Product --</option>
        <option v-for="product in productOptions" :key="product.value" :value="product.value">
          {{ product.label }}
        </option>
      </select>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  entityName: { type: String, required: true },
  showFilters: { type: Boolean, default: true },
  serviceOptions: { type: Array, default: () => [] },
  productOptions: { type: Array, default: () => [] },
  serviceFilter: { type: String, default: '' },
  productFilter: { type: String, default: '' }
});

const selectedService = ref(props.serviceFilter);
const selectedProduct = ref(props.productFilter);

// Watch for external changes
watch(() => props.serviceFilter, (newVal) => {
  selectedService.value = newVal;
});

watch(() => props.productFilter, (newVal) => {
  selectedProduct.value = newVal;
});

defineEmits(['serviceChange', 'productChange']);
</script>

<style scoped>
.filters-container {
  margin-bottom: 20px;
}

.filter-section {
  margin-bottom: 20px;
  padding: 15px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--bg-color);
}

.filter-section label {
  display: inline-block;
  margin-right: 10px;
  font-weight: bold;
}

.filter-section select {
  padding: 8px;
  min-width: 300px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--input-bg);
  color: var(--text-color);
}
</style>