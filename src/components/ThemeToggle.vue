<template>
  <button 
    @click="handleToggle" 
    class="theme-toggle"
    :aria-label="`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`"
  >
    <span v-if="theme === 'light'">🌙</span>
    <span v-else>☀️</span>
  </button>
</template>

<script setup>
import { useTheme } from '../composables/useTheme.js';
import { useErrorHandler } from '../composables/useErrorHandler';

const { theme, toggleTheme } = useTheme();
const { handleError } = useErrorHandler();

const handleToggle = () => {
  try {
    toggleTheme();
  } catch (error) {
    handleError(error, 'theme toggle');
  }
};
</script>

<style scoped>
.theme-toggle {
  background: none;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s;
}

.theme-toggle:hover {
  background-color: var(--table-filter-bg);
}
</style>