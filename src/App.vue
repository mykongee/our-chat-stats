<script setup>
import { ref } from 'vue'
import FileUpload from './components/upload/FileUpload.vue'
import { parseChatHTML } from './composables/useChatParser'

const selectedFile = ref(null)
const parsedData = ref(null)
const isParsingError = ref(null)
const isParsing = ref(false)
const ignoredEmojis = ref(new Set())
const ignoreInput = ref('')

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

function handleIgnoreInputChange() {
  // Extract emojis from input (same regex as parser for consistency)
  const emojiRegex = /(?:[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2190}-\u{21FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]|[\u{231A}-\u{231B}]|[\u{23E9}-\u{23EC}]|[\u{23F0}]|[\u{23F3}]|[\u{25FD}-\u{25FE}]|[\u{2614}-\u{2615}]|[\u{2648}-\u{2653}]|[\u{267F}]|[\u{2693}]|[\u{26A1}]|[\u{26AA}-\u{26AB}]|[\u{26BD}-\u{26BE}]|[\u{26C4}-\u{26C5}]|[\u{26CE}]|[\u{26D4}]|[\u{26EA}]|[\u{26F2}-\u{26F3}]|[\u{26F5}]|[\u{26FA}]|[\u{26FD}]|[\u{2705}]|[\u{270A}-\u{270B}]|[\u{2728}]|[\u{274C}]|[\u{274E}]|[\u{2753}-\u{2755}]|[\u{2757}]|[\u{2795}-\u{2797}]|[\u{27B0}]|[\u{27BF}]|[\u{2B1B}-\u{2B1C}]|[\u{2B50}]|[\u{2B55}])(?:[\u{1F3FB}-\u{1F3FF}]|\uFE0F\u20E3?)?(?:\u200D(?:[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2190}-\u{21FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]|[\u{231A}-\u{231B}]|[\u{23E9}-\u{23EC}]|[\u{23F0}]|[\u{23F3}]|[\u{25FD}-\u{25FE}]|[\u{2614}-\u{2615}]|[\u{2648}-\u{2653}]|[\u{267F}]|[\u{2693}]|[\u{26A1}]|[\u{26AA}-\u{26AB}]|[\u{26BD}-\u{26BE}]|[\u{26C4}-\u{26C5}]|[\u{26CE}]|[\u{26D4}]|[\u{26EA}]|[\u{26F2}-\u{26F3}]|[\u{26F5}]|[\u{26FA}]|[\u{26FD}]|[\u{2705}]|[\u{270A}-\u{270B}]|[\u{2728}]|[\u{274C}]|[\u{274E}]|[\u{2753}-\u{2755}]|[\u{2757}]|[\u{2795}-\u{2797}]|[\u{27B0}]|[\u{27BF}]|[\u{2B1B}-\u{2B1C}]|[\u{2B50}]|[\u{2B55}])(?:[\u{1F3FB}-\u{1F3FF}]|\uFE0F)?)*/gu
  const emojis = ignoreInput.value.match(emojiRegex) || []

  ignoredEmojis.value = new Set(emojis)

  // Recalculate statistics
  if (parsedData.value) {
    recalculateStatistics()
  }
}

function recalculateStatistics() {
  if (!parsedData.value) return

  const messageCountByUser = {}
  const emojiCountByUser = {}
  const totalEmojiCount = {}

  for (const message of parsedData.value.messages) {
    const sender = message.sender

    // Count messages per user
    messageCountByUser[sender] = (messageCountByUser[sender] || 0) + 1

    // Filter emojis based on ignored set
    const filteredEmojis = message.emojis.filter(emoji => !ignoredEmojis.value.has(emoji))

    // Count emojis
    if (!emojiCountByUser[sender]) {
      emojiCountByUser[sender] = {}
    }

    for (const emoji of filteredEmojis) {
      // Per-user emoji count
      emojiCountByUser[sender][emoji] = (emojiCountByUser[sender][emoji] || 0) + 1

      // Total emoji count
      totalEmojiCount[emoji] = (totalEmojiCount[emoji] || 0) + 1
    }
  }

  // Create sorted topEmojis array
  const topEmojis = Object.entries(totalEmojiCount)
    .map(([emoji, count]) => ({ emoji, count }))
    .sort((a, b) => b.count - a.count)

  // Update statistics
  parsedData.value.statistics = {
    messageCountByUser,
    emojiCountByUser,
    totalEmojiCount,
    topEmojis,
  }
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

          <div class="ignore-emoji-input">
            <label for="ignore-emojis">Ignore emojis (type emojis to exclude):</label>
            <input
              id="ignore-emojis"
              v-model="ignoreInput"
              @input="handleIgnoreInputChange"
              type="text"
              placeholder="🌹❤️✨"
              class="emoji-input"
            />
            <p class="input-hint" v-if="ignoredEmojis.size > 0">
              Ignoring: {{ Array.from(ignoredEmojis).join(' ') }}
            </p>
          </div>

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

.ignore-emoji-input {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: var(--color-surface-alt);
  border-radius: var(--border-radius-sm);
}

.ignore-emoji-input label {
  display: block;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-bottom: 0.5rem;
}

.emoji-input {
  width: 100%;
  padding: 0.75rem;
  font-size: var(--font-size-lg);
  border: 2px solid var(--color-border);
  border-radius: var(--border-radius-md);
  background: var(--color-surface);
  color: var(--color-text-primary);
  transition: border-color var(--transition-fast);
}

.emoji-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.emoji-input::placeholder {
  color: var(--color-text-secondary);
  opacity: 0.6;
}

.input-hint {
  margin: 0.5rem 0 0;
  font-size: var(--font-size-sm);
  color: var(--color-primary);
}
</style>
