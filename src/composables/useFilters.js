import { ref, computed } from 'vue';

export const useFilters = (items, fields) => {
  const filters = ref({});
  const sortField = ref('');
  const sortDirection = ref('asc');

  // Initialize filters for all fields
  fields.forEach(field => {
    filters.value[field] = '';
  });

  const filteredItems = computed(() => {
    let filtered = items.value.filter(item => {
      return fields.every(field => {
        const filterValue = filters.value[field];
        if (!filterValue) return true;
        const itemValue = String(item[field] || '').toLowerCase();
        return itemValue.includes(filterValue.toLowerCase());
      });
    });

    // Apply sorting
    if (sortField.value) {
      filtered.sort((a, b) => {
        const aVal = String(a[sortField.value] || '').toLowerCase();
        const bVal = String(b[sortField.value] || '').toLowerCase();
        const comparison = aVal.localeCompare(bVal);
        return sortDirection.value === 'asc' ? comparison : -comparison;
      });
    }

    return filtered;
  });

  const clearFilters = () => {
    fields.forEach(field => {
      filters.value[field] = '';
    });
  };

  const sortBy = (field) => {
    if (sortField.value === field) {
      sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
    } else {
      sortField.value = field;
      sortDirection.value = 'asc';
    }
  };

  return {
    filters,
    sortField,
    sortDirection,
    filteredItems,
    clearFilters,
    sortBy
  };
};