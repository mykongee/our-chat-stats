<script setup>
import { ref } from 'vue'
import FileUpload from './components/upload/FileUpload.vue'

const selectedFile = ref(null)

function handleFileSelected(file) {
  selectedFile.value = file
  console.log('File selected:', file)
}
</script>

<template>
  <div class="app">
    <header class="header">
      <h1 class="title">Our Chat Stats</h1>
      <p class="subtitle">Analyze your Instagram conversations</p>
    </header>

    <main class="main">
      <FileUpload @file-selected="handleFileSelected" />

      <div v-if="selectedFile" class="file-info">
        <h2>Selected File</h2>
        <p><strong>Name:</strong> {{ selectedFile.name }}</p>
        <p><strong>Size:</strong> {{ (selectedFile.size / 1024).toFixed(2) }} KB</p>
        <p><strong>Type:</strong> {{ selectedFile.type }}</p>
      </div>
    </main>
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  padding: 2rem;
  background: var(--color-background);
}

.header {
  text-align: center;
  margin-bottom: 3rem;
}

.title {
  font-family: var(--font-family-heading);
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin: 0 0 0.5rem;
}

.subtitle {
  font-size: var(--font-size-lg);
  color: var(--color-text-secondary);
  margin: 0;
}

.main {
  max-width: 800px;
  margin: 0 auto;
}

.file-info {
  margin-top: 2rem;
  padding: 1.5rem;
  background: var(--color-surface);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--color-border);
}

.file-info h2 {
  font-family: var(--font-family-heading);
  font-size: var(--font-size-lg);
  color: var(--color-text-primary);
  margin: 0 0 1rem;
}

.file-info p {
  margin: 0.5rem 0;
  color: var(--color-text-primary);
}
</style>
