import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import ThemeToggle from '../components/ThemeToggle.vue';

vi.mock('../composables/useTheme.js', () => ({
  useTheme: () => ({
    theme: { value: 'light' },
    toggleTheme: vi.fn()
  })
}));

vi.mock('../composables/useErrorHandler', () => ({
  useErrorHandler: () => ({
    handleError: vi.fn()
  })
}));

describe('ThemeToggle', () => {
  it('should render theme toggle button', () => {
    const wrapper = mount(ThemeToggle);
    expect(wrapper.find('.theme-toggle').exists()).toBe(true);
  });

  it('should show moon icon for light theme', () => {
    const wrapper = mount(ThemeToggle);
    expect(wrapper.text()).toContain('🌙');
  });
});