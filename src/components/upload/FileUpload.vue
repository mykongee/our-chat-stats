<script setup>
import { ref } from 'vue'

const emit = defineEmits(['file-selected'])

const isDragging = ref(false)
const fileInput = ref(null)
const error = ref(null)

function handleFileSelect(event) {
  const file = event.target.files?.[0]
  if (file) {
    processFile(file)
  }
}

function handleDrop(event) {
  isDragging.value = false
  const file = event.dataTransfer.files?.[0]
  if (file) {
    processFile(file)
  }
}

function processFile(file) {
  error.value = null

  // Security: Validate file type
  const isHtml = file.name.endsWith('.html') ||
                 file.name.endsWith('.htm') ||
                 file.type === 'text/html'

  if (!isHtml) {
    error.value = 'Please upload an HTML file (.html or .htm)'
    return
  }

  // Security: Validate file size (max 50MB to prevent memory issues)
  const maxSize = 50 * 1024 * 1024
  if (file.size > maxSize) {
    error.value = 'File is too large. Maximum size is 50MB'
    return
  }

  // Security: Check for minimum file size (empty files or suspiciously small)
  if (file.size === 0) {
    error.value = 'File is empty'
    return
  }

  emit('file-selected', file)
}

function triggerFileInput() {
  fileInput.value?.click()
}

function handleDragOver(event) {
  isDragging.value = true
}

function handleDragLeave(event) {
  isDragging.value = false
}
</script>

<template>
  <div class="file-upload">
    <div
      class="upload-zone"
      :class="{ 'upload-zone--dragging': isDragging }"
      @drop.prevent="handleDrop"
      @dragover.prevent="handleDragOver"
      @dragleave="handleDragLeave"
      @click="triggerFileInput"
    >
      <div class="upload-zone__content">
        <svg
          class="upload-zone__icon"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        <h3 class="upload-zone__title">Upload Instagram Chat</h3>
        <p class="upload-zone__description">
          Drop your HTML file here or click to browse
        </p>
        <p class="upload-zone__hint">HTML files only, max 50MB</p>
      </div>

      <input
        ref="fileInput"
        type="file"
        accept=".html,.htm,text/html"
        class="upload-zone__input"
        @change="handleFileSelect"
      />
    </div>

    <div v-if="error" class="error-message" role="alert">
      {{ error }}
    </div>
  </div>
</template>

<style scoped>
.file-upload {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
}

.upload-zone {
  border: 2px dashed var(--color-border);
  border-radius: var(--border-radius-md);
  padding: 3rem 2rem;
  text-align: center;
  cursor: pointer;
  transition: all var(--transition-normal);
  background: var(--color-surface);
}

.upload-zone:hover {
  border-color: var(--color-primary);
  background: var(--color-surface-alt);
}

.upload-zone--dragging {
  border-color: var(--color-primary);
  background: var(--color-surface-alt);
  transform: scale(1.02);
}

.upload-zone__content {
  pointer-events: none;
}

.upload-zone__icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 1rem;
  color: var(--color-primary);
}

.upload-zone__title {
  font-family: var(--font-family-heading);
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  margin: 0 0 0.5rem;
}

.upload-zone__description {
  font-size: var(--font-size-md);
  color: var(--color-text-secondary);
  margin: 0 0 0.25rem;
}

.upload-zone__hint {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin: 0;
}

.upload-zone__input {
  display: none;
}

.error-message {
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  background: var(--color-surface-alt);
  border: 1px solid var(--color-error);
  border-radius: var(--border-radius-sm);
  color: var(--color-error);
  font-size: var(--font-size-sm);
}
</style>
