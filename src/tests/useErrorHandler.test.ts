import { describe, it, expect } from 'vitest';
import { useErrorHandler } from '../composables/useErrorHandler';

describe('useErrorHandler', () => {
  it('should handle error with message', () => {
    const { error, showErrorModal, handleError } = useErrorHandler();
    
    handleError(new Error('Test error'), 'test context');
    
    expect(error.value).toBe('Test error');
    expect(showErrorModal.value).toBe(true);
  });

  it('should clear error', () => {
    const { error, showErrorModal, handleError, clearError } = useErrorHandler();
    
    handleError(new Error('Test error'));
    clearError();
    
    expect(error.value).toBe('');
    expect(showErrorModal.value).toBe(false);
  });
});