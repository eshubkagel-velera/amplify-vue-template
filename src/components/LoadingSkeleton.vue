<template>
  <div class="skeleton-container">
    <div v-for="n in rows" :key="n" class="skeleton-row">
      <div v-for="col in columns" :key="col" class="skeleton-cell">
        <div class="skeleton-shimmer"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  rows?: number;
  columns?: number;
}

withDefaults(defineProps<Props>(), {
  rows: 5,
  columns: 4
});
</script>

<style scoped>
.skeleton-container {
  width: 100%;
}

.skeleton-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.skeleton-cell {
  flex: 1;
  height: 40px;
  background: var(--table-filter-bg);
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

.skeleton-shimmer {
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, var(--table-filter-bg) 25%, var(--border-color) 50%, var(--table-filter-bg) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

@media (prefers-reduced-motion: reduce) {
  .skeleton-shimmer {
    animation: none;
  }
}
</style>