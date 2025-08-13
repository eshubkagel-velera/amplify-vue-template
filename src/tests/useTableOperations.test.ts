import { describe, it, expect } from 'vitest';
import { useTableOperations } from '../composables/useTableOperations';

describe('useTableOperations', () => {
  const mockItems = [
    { id: 1, name: 'Item 1', type: 'A' },
    { id: 2, name: 'Item 2', type: 'B' }
  ];

  it('should toggle select all', () => {
    const { selectedItems, allSelected, toggleSelectAll } = useTableOperations(mockItems, item => item.id);
    
    toggleSelectAll();
    expect(selectedItems.value).toEqual([1, 2]);
    expect(allSelected.value).toBe(true);
    
    toggleSelectAll();
    expect(selectedItems.value).toEqual([]);
    expect(allSelected.value).toBe(false);
  });

  it('should sort by field', () => {
    const { sortField, sortDirection, sortBy } = useTableOperations(mockItems, item => item.id);
    
    sortBy('name');
    expect(sortField.value).toBe('name');
    expect(sortDirection.value).toBe('asc');
    
    sortBy('name');
    expect(sortDirection.value).toBe('desc');
  });

  it('should apply filters', () => {
    const { filters, applyFilters } = useTableOperations(mockItems, item => item.id);
    
    filters.value.name = 'Item 1';
    const filtered = applyFilters(mockItems, ['name']);
    
    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe('Item 1');
  });
});