<script setup>
import { ref } from 'vue'
import FileUpload from './components/upload/FileUpload.vue'
import { parseChatHTML } from './composables/useChatParser'

const selectedFile = ref(null)
const parsedData = ref(null)
const isParsingError = ref(null)
const isParsing = ref(false)

async function handleFileSelected(file) {
  selectedFile.value = file
  isParsing.value = true
  isParsingError.value = null
  parsedData.value = null

  try {
    console.log('Parsing file:', file.name)
    const result = await parseChatHTML(file)
    parsedData.value = result
    console.log('Parsed data:', result)
  } catch (error) {
    console.error('Parsing error:', error)
    isParsingError.value = error.message
  } finally {
    isParsing.value = false
  }
}

function getTotalEmojis(emojisByUser) {
  return Object.values(emojisByUser).reduce((sum, count) => sum + count, 0)
}

function getTopEmojisByUser(emojisByUser, limit = 5) {
  return Object.entries(emojisByUser)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .reduce((obj, [emoji, count]) => {
      obj[emoji] = count
      return obj
    }, {})
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

      <div v-if="isParsing" class="parsing-status">
        <p>Parsing chat history...</p>
      </div>

      <div v-if="isParsingError" class="error-box">
        <h2>Parsing Error</h2>
        <p>{{ isParsingError }}</p>
      </div>

      <div v-if="parsedData" class="results">
        <div class="result-card">
          <h2>Conversation: {{ parsedData.meta.conversationTitle }}</h2>
          <p><strong>Total Messages:</strong> {{ parsedData.meta.totalMessages }}</p>
          <p><strong>Participants:</strong> {{ parsedData.meta.participants.join(', ') }}</p>
          <p v-if="parsedData.meta.dateRange.start">
            <strong>Date Range:</strong>
            {{ parsedData.meta.dateRange.start.toLocaleDateString() }} -
            {{ parsedData.meta.dateRange.end.toLocaleDateString() }}
          </p>
        </div>

        <div class="result-card">
          <h2>Message Count by User</h2>
          <ul>
            <li v-for="(count, user) in parsedData.statistics.messageCountByUser" :key="user">
              <strong>{{ user }}:</strong> {{ count }} messages
            </li>
          </ul>
        </div>

        <div class="result-card">
          <h2>Emoji Usage Comparison</h2>
          <div class="emoji-comparison">
            <div v-for="(emojisByUser, user) in parsedData.statistics.emojiCountByUser" :key="user" class="user-emoji-stats">
              <h3>{{ user }}</h3>
              <p class="emoji-total">
                <strong>{{ getTotalEmojis(emojisByUser) }}</strong> emojis used
              </p>
              <div class="top-emojis-list">
                <p>Top emojis:</p>
                <div class="emoji-badges">
                  <span v-for="(count, emoji) in getTopEmojisByUser(emojisByUser, 5)" :key="emoji" class="emoji-badge">
                    {{ emoji }} {{ count }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="result-card">
          <h2>Top Emojis Overall</h2>
          <ul>
            <li v-for="item in parsedData.statistics.topEmojis.slice(0, 10)" :key="item.emoji">
              {{ item.emoji }} - {{ item.count }} times
            </li>
          </ul>
        </div>

        <div class="result-card">
          <h2>Sample Messages</h2>
          <div v-for="(message, index) in parsedData.messages.slice(0, 5)" :key="index" class="message-preview">
            <p><strong>{{ message.sender }}:</strong> {{ message.content || `[${message.type}]` }}</p>
            <p class="timestamp" v-if="message.timestamp">{{ message.timestamp.toLocaleString() }}</p>
          </div>
        </div>
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

.parsing-status {
  margin-top: 2rem;
  padding: 2rem;
  text-align: center;
  background: var(--color-surface-alt);
  border-radius: var(--border-radius-md);
  color: var(--color-text-secondary);
}

.error-box {
  margin-top: 2rem;
  padding: 1.5rem;
  background: var(--color-surface);
  border: 2px solid var(--color-error);
  border-radius: var(--border-radius-md);
}

.error-box h2 {
  color: var(--color-error);
  margin: 0 0 0.5rem;
}

.results {
  margin-top: 2rem;
}

.result-card {
  margin-bottom: 1.5rem;
  padding: 1.5rem;
  background: var(--color-surface);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
}

.result-card h2 {
  font-family: var(--font-family-heading);
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  margin: 0 0 1rem;
}

.result-card ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.result-card li {
  padding: 0.5rem 0;
  color: var(--color-text-primary);
  border-bottom: 1px solid var(--color-border);
}

.result-card li:last-child {
  border-bottom: none;
}

.message-preview {
  padding: 0.75rem;
  margin-bottom: 0.75rem;
  background: var(--color-surface-alt);
  border-radius: var(--border-radius-sm);
}

.message-preview p {
  margin: 0.25rem 0;
  color: var(--color-text-primary);
}

.message-preview .timestamp {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.emoji-comparison {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.user-emoji-stats {
  padding: 1rem;
  background: var(--color-surface-alt);
  border-radius: var(--border-radius-md);
  border: 2px solid var(--color-border);
}

.user-emoji-stats h3 {
  font-family: var(--font-family-heading);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  margin: 0 0 0.75rem;
}

.emoji-total {
  font-size: var(--font-size-xl);
  color: var(--color-primary);
  margin: 0 0 1rem;
}

.emoji-total strong {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
}

.top-emojis-list p {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin: 0 0 0.5rem;
}

.emoji-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.emoji-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-lg);
  font-size: var(--font-size-md);
  color: var(--color-text-primary);
}
</style>
