import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useChatStore = defineStore('chat', () => {
  // State
  const parsedData = ref(null)
  const rawFile = ref(null)
  const fileName = ref('')
  const parseError = ref(null)

  // Getters
  const hasData = computed(() => parsedData.value !== null)

  const meta = computed(() => parsedData.value?.meta || null)

  const messages = computed(() => parsedData.value?.messages || [])

  const statistics = computed(() => parsedData.value?.statistics || null)

  const participants = computed(() => meta.value?.participants || [])

  const totalMessages = computed(() => meta.value?.totalMessages || 0)

  const conversationTitle = computed(() => meta.value?.conversationTitle || '')

  const dateRange = computed(() => meta.value?.dateRange || null)

  const messageCountByUser = computed(() => statistics.value?.messageCountByUser || {})

  const emojiCountByUser = computed(() => statistics.value?.emojiCountByUser || {})

  const totalEmojiCount = computed(() => statistics.value?.totalEmojiCount || {})

  const topEmojis = computed(() => statistics.value?.topEmojis || [])

  // Actions
  function setParsedData(data) {
    parsedData.value = data
    parseError.value = null
  }

  function setRawFile(file) {
    rawFile.value = file
    fileName.value = file?.name || ''
  }

  function setParseError(error) {
    parseError.value = error
  }

  function clearData() {
    parsedData.value = null
    rawFile.value = null
    fileName.value = ''
    parseError.value = null
  }

  function updateStatistics(newStats) {
    if (parsedData.value) {
      parsedData.value = {
        ...parsedData.value,
        statistics: newStats
      }
    }
  }

  return {
    // State
    parsedData,
    rawFile,
    fileName,
    parseError,

    // Getters
    hasData,
    meta,
    messages,
    statistics,
    participants,
    totalMessages,
    conversationTitle,
    dateRange,
    messageCountByUser,
    emojiCountByUser,
    totalEmojiCount,
    topEmojis,

    // Actions
    setParsedData,
    setRawFile,
    setParseError,
    clearData,
    updateStatistics
  }
})
