import { ref } from 'vue';

export const useErrorHandler = () => {
  const error = ref('');
  const showErrorModal = ref(false);

  const handleError = (err: any, context = '') => {
    console.error(`Error in ${context}:`, err);
    error.value = err.message || err.errors?.[0]?.message || 'An unexpected error occurred';
    showErrorModal.value = true;
  };

  const clearError = () => {
    error.value = '';
    showErrorModal.value = false;
  };

  return {
    error,
    showErrorModal,
    handleError,
    clearError
  };
};