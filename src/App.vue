<script setup>
import { onMounted } from 'vue'
import { useChatStore } from './stores/chatStore'
import { useThemeStore } from './stores/themeStore'
import { useUiStore } from './stores/uiStore'
import { parseChatHTML } from './composables/useChatParser'
import FileUpload from './components/upload/FileUpload.vue'
import ThemeSwitcher from './components/ui/ThemeSwitcher.vue'
import StatsView from './views/StatsView.vue'

const chatStore = useChatStore()
const themeStore = useThemeStore()
const uiStore = useUiStore()

// Initialize theme on mount
onMounted(() => {
  themeStore.initializeTheme()
})

async function handleFileSelected(file) {
  chatStore.setRawFile(file)
  uiStore.setLoading(true, 'Parsing chat history...')
  chatStore.setParseError(null)

  try {
    console.log('Parsing file:', file.name)
    const result = await parseChatHTML(file)
    chatStore.setParsedData(result)
    console.log('Parsed data:', result)
    uiStore.setView('overview')
  } catch (error) {
    console.error('Parsing error:', error)
    chatStore.setParseError(error.message)
  } finally {
    uiStore.setLoading(false)
  }
}
</script>

<template>
  <div class="app">
    <header class="header">
      <div class="header__content">
        <div class="header__text">
          <h1 class="title">Our Chat Stats</h1>
          <p class="subtitle">Analyze your Instagram conversations</p>
        </div>
        <ThemeSwitcher />
      </div>
    </header>

    <main class="main">
      <div v-if="!chatStore.hasData" class="upload-section">
        <FileUpload @file-selected="handleFileSelected" />

        <div v-if="uiStore.isLoading" class="loading-status">
          <div class="loading-spinner"></div>
          <p>{{ uiStore.loadingMessage }}</p>
        </div>

        <div v-if="chatStore.parseError" class="error-box">
          <h2>Parsing Error</h2>
          <p>{{ chatStore.parseError }}</p>
          <button @click="chatStore.clearData()" class="retry-button">
            Try Another File
          </button>
        </div>
      </div>

      <div v-else class="stats-section">
        <button @click="chatStore.clearData()" class="clear-button">
          Upload New File
        </button>
        <StatsView />
      </div>
    </main>

    <footer class="footer">
      <p>All processing happens locally in your browser. Your data never leaves your device.</p>
    </footer>
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--color-background);
}

/* Header */
.header {
  padding: var(--spacing-xl) var(--spacing-lg);
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
}

.header__content {
  max-width: var(--container-max-width);
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-lg);
  flex-wrap: wrap;
}

.header__text {
  flex: 1;
}

.title {
  font-family: var(--font-family-heading);
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-xs);
}

.subtitle {
  font-size: var(--font-size-lg);
  color: var(--color-text-secondary);
  margin: 0;
}

/* Main */
.main {
  flex: 1;
  padding: var(--spacing-xl);
}

.upload-section {
  max-width: 600px;
  margin: 0 auto;
}

.stats-section {
  width: 100%;
}

.clear-button {
  display: block;
  margin: 0 auto var(--spacing-xl);
  padding: var(--spacing-sm) var(--spacing-lg);
  font-family: var(--font-family-primary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.clear-button:hover {
  color: var(--color-text-primary);
  border-color: var(--color-primary);
  box-shadow: var(--shadow-sm);
}

/* Loading */
.loading-status {
  margin-top: var(--spacing-xl);
  padding: var(--spacing-xl);
  text-align: center;
  background: var(--color-surface);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--color-border);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  margin: 0 auto var(--spacing-md);
  border: 4px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-status p {
  color: var(--color-text-secondary);
  font-size: var(--font-size-md);
  margin: 0;
}

/* Error */
.error-box {
  margin-top: var(--spacing-xl);
  padding: var(--spacing-lg);
  background: var(--color-surface);
  border: 2px solid var(--color-error);
  border-radius: var(--border-radius-md);
  text-align: center;
}

.error-box h2 {
  font-family: var(--font-family-heading);
  color: var(--color-error);
  margin: 0 0 var(--spacing-sm);
}

.error-box p {
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-md);
}

.retry-button {
  padding: var(--spacing-sm) var(--spacing-lg);
  font-family: var(--font-family-primary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: white;
  background: var(--color-primary);
  border: none;
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.retry-button:hover {
  opacity: 0.9;
  box-shadow: var(--shadow-md);
}

/* Footer */
.footer {
  padding: var(--spacing-lg);
  text-align: center;
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
}

.footer p {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

/* Responsive */
@media (max-width: 768px) {
  .header__content {
    flex-direction: column;
    align-items: flex-start;
  }

  .title {
    font-size: var(--font-size-xl);
  }

  .subtitle {
    font-size: var(--font-size-md);
  }
}
</style>
