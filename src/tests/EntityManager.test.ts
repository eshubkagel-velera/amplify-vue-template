import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import EntityManager from '../components/EntityManager.vue';

vi.mock('aws-amplify/api', () => ({
  generateClient: () => ({
    graphql: vi.fn()
  })
}));

describe('EntityManager', () => {
  const defaultProps = {
    entityName: 'TEST_ENTITY',
    fields: ['ID', 'NAME'],
    formFields: [
      { name: 'ID', type: 'number', required: true, disabled: false },
      { name: 'NAME', type: 'text', required: true, disabled: false }
    ],
    idField: 'ID',
    loadFunction: vi.fn(),
    createFunction: vi.fn(),
    updateFunction: vi.fn(),
    deleteFunction: vi.fn()
  };

  it('should render entity name in header', () => {
    const wrapper = mount(EntityManager, { props: defaultProps });
    expect(wrapper.text()).toContain('TEST_ENTITY Manager');
  });

  it('should show create modal when add button clicked', async () => {
    const wrapper = mount(EntityManager, { props: defaultProps });
    
    await wrapper.find('.btn-success').trigger('click');
    expect(wrapper.find('.modal-overlay').exists()).toBe(true);
    expect(wrapper.text()).toContain('Create TEST_ENTITY');
  });
});