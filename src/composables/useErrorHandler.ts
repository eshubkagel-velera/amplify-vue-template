import { ref } from 'vue';

const sanitizeForLog = (input: string): string => {
  return input.replace(/[\r\n\t]/g, ' ').substring(0, 200);
};

export const useErrorHandler = () => {
  const error = ref('');
  const showErrorModal = ref(false);

  const handleError = (err: Error | { message: string; errors?: any[] }, context = '') => {
    const message = err.message || err.errors?.[0]?.message || 'An unexpected error occurred';
    console.error(`Error in ${sanitizeForLog(context)}:`, sanitizeForLog(message));
    error.value = message;
    showErrorModal.value = true;
  };

  const handleGraphQLError = (err: any, context: string) => {
    if (err.errors) {
      const errorMessages = err.errors.map((e: any) => sanitizeForLog(e.message || '')).join('; ');
      console.error(`GraphQL error in ${sanitizeForLog(context)}:`, errorMessages);
      error.value = errorMessages;
    } else {
      const message = sanitizeForLog(err.message || 'GraphQL operation failed');
      console.error(`GraphQL error in ${sanitizeForLog(context)}:`, message);
      error.value = message;
    }
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