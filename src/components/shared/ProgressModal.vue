<template>
  <div v-if="show" class="modal-overlay progress-overlay">
    <div class="modal-content">
      <h3>{{ operation }}</h3>
      <p>Processing {{ current }} of {{ total }} records...</p>
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: (current / total * 100) + '%' }"></div>
      </div>
      <p class="progress-text">{{ Math.round(current / total * 100) }}% Complete</p>
    </div>
  </div>
  <div v-if="show" class="grey-overlay"></div>
</template>

<script setup>
defineProps({
  show: Boolean,
  operation: String,
  current: Number,
  total: Number
});
</script>

<style scoped>
.progress-overlay {
  z-index: 1001;
}

.progress-bar {
  width: 100%;
  height: 20px;
  background-color: #f0f0f0;
  border-radius: 10px;
  overflow: hidden;
  margin: 15px 0;
}

.progress-fill {
  height: 100%;
  background-color: #007bff;
  transition: width 0.3s ease;
}

.progress-text {
  text-align: center;
  font-weight: bold;
  margin: 10px 0;
}

.grey-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(128, 128, 128, 0.5);
  z-index: 999;
  pointer-events: none;
}
</style>