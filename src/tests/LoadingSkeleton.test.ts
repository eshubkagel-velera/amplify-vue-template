import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import LoadingSkeleton from '../components/LoadingSkeleton.vue';

describe('LoadingSkeleton', () => {
  it('should render default rows and columns', () => {
    const wrapper = mount(LoadingSkeleton);
    expect(wrapper.findAll('.skeleton-row')).toHaveLength(5);
    expect(wrapper.findAll('.skeleton-cell')).toHaveLength(20); // 5 rows * 4 columns
  });

  it('should render custom rows and columns', () => {
    const wrapper = mount(LoadingSkeleton, {
      props: { rows: 3, columns: 2 }
    });
    expect(wrapper.findAll('.skeleton-row')).toHaveLength(3);
    expect(wrapper.findAll('.skeleton-cell')).toHaveLength(6); // 3 rows * 2 columns
  });
});