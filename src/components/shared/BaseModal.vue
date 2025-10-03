<template>
  <div v-if="show" class="modal-overlay">
    <div class="modal-content" :class="size">
      <h3 v-if="title">{{ title }}</h3>
      <slot />
      <div v-if="showActions" class="form-actions">
        <slot name="actions">
          <button @click="$emit('confirm')" :class="confirmClass" :disabled="loading">
            {{ loading ? loadingText : confirmText }}
          </button>
          <button @click="$emit('cancel')" class="btn-primary" :disabled="loading">
            Cancel
          </button>
        </slot>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  show: { type: Boolean, default: false },
  title: { type: String, default: '' },
  size: { type: String, default: '' },
  showActions: { type: Boolean, default: true },
  confirmText: { type: String, default: 'OK' },
  confirmClass: { type: String, default: 'btn-primary' },
  loading: { type: Boolean, default: false },
  loadingText: { type: String, default: 'Loading...' }
});

defineEmits(['confirm', 'cancel']);
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding-top: 300px;
  z-index: 1000;
}

.modal-content {
  background: var(--modal-bg);
  color: var(--text-color);
  padding: 30px;
  border-radius: 8px;
  min-width: 400px;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-content.large {
  min-width: 800px;
  max-width: 90vw;
}

.form-actions {
  margin-top: 15px;
  text-align: center;
}

button {
  margin-right: 10px;
  padding: 8px 12px;
  cursor: pointer;
}
</style>