import { ref, computed } from 'vue';

export const useTableOperations = <T>(items: T[], getItemId: (item: T) => any) => {
  const selectedItems = ref<any[]>([]);
  const sortField = ref('');
  const sortDirection = ref<'asc' | 'desc'>('asc');
  const filters = ref<Record<string, string>>({});

  const allSelected = computed(() => 
    items.length > 0 && selectedItems.value.length === items.length
  );

  const toggleSelectAll = () => {
    selectedItems.value = allSelected.value ? [] : items.map(getItemId);
  };

  const sortBy = (field: string) => {
    if (sortField.value === field) {
      sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
    } else {
      sortField.value = field;
      sortDirection.value = 'asc';
    }
  };

  const applyFilters = (data: T[], fields: string[]) => {
    return data.filter(item => 
      fields.every(field => {
        const filterValue = filters.value[field];
        if (!filterValue) return true;
        const itemValue = String((item as any)[field] || '').toLowerCase();
        return itemValue.includes(filterValue.toLowerCase());
      })
    ).sort((a, b) => {
      if (!sortField.value) return 0;
      const aVal = String((a as any)[sortField.value] || '').toLowerCase();
      const bVal = String((b as any)[sortField.value] || '').toLowerCase();
      const comparison = aVal.localeCompare(bVal);
      return sortDirection.value === 'asc' ? comparison : -comparison;
    });
  };

  return {
    selectedItems,
    sortField,
    sortDirection,
    filters,
    allSelected,
    toggleSelectAll,
    sortBy,
    applyFilters
  };
};