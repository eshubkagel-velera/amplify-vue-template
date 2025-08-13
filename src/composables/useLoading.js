import { ref } from 'vue';

export const useLoading = () => {
  const loading = ref(false);
  const saving = ref(false);
  const deleting = ref(false);

  const setLoading = (value) => {
    loading.value = value;
  };

  const setSaving = (value) => {
    saving.value = value;
  };

  const setDeleting = (value) => {
    deleting.value = value;
  };

  const withLoading = async (asyncFn, loadingType = 'loading') => {
    const setterMap = {
      loading: setLoading,
      saving: setSaving,
      deleting: setDeleting
    };
    
    const setter = setterMap[loadingType] || setLoading;
    
    try {
      setter(true);
      return await asyncFn();
    } finally {
      setter(false);
    }
  };

  return {
    loading,
    saving,
    deleting,
    setLoading,
    setSaving,
    setDeleting,
    withLoading
  };
};