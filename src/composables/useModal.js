import { ref } from 'vue';

export const useModal = () => {
  const showModal = ref(false);
  const modalTitle = ref('');
  const modalMessage = ref('');

  const openModal = (title = '', message = '') => {
    modalTitle.value = title;
    modalMessage.value = message;
    showModal.value = true;
  };

  const closeModal = () => {
    showModal.value = false;
    modalTitle.value = '';
    modalMessage.value = '';
  };

  return {
    showModal,
    modalTitle,
    modalMessage,
    openModal,
    closeModal
  };
};