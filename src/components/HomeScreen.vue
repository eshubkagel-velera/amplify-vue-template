<template>
  <div class="home-screen">
    <div class="welcome-section">
      <h1>Welcome to Hazel Mapping Editor</h1>
      <p>Select a screen from the dropdown above to get started.</p>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.home-screen {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  padding: 40px;
}

.welcome-section {
  text-align: center;
  max-width: 600px;
}

.welcome-section h1 {
  color: var(--text-color, #333);
  margin-bottom: 20px;
}

.welcome-section p {
  color: var(--text-color, #666);
  font-size: 1.1rem;
}
</style>