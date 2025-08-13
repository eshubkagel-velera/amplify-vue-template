import { ref } from 'vue';

export const useErrorHandler = () => {
  const error = ref('');
  const showErrorModal = ref(false);

  const handleError = (err: any, context = '') => {
    console.error(`Error in ${context}:`, err);
    error.value = err.message || err.errors?.[0]?.message || 'An unexpected error occurred';
    showErrorModal.value = true;
  };

  const handleGraphQLError = (err: any, context: string) => {
    console.error(`GraphQL error in ${context}:`, err);
    if (err.errors) {
      console.error('GraphQL errors:', err.errors);
      err.errors.forEach((e: any, index: number) => {
        console.error(`Error ${index + 1}:`, e.message);
      });
    }
    const errorMsg = err.errors ? err.errors.map((e: any) => e.message).join('; ') : (err.message || err);
    error.value = errorMsg;
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
    handleGraphQLError,
    clearError
  };
};