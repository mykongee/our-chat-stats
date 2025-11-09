import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUiStore = defineStore('ui', () => {
  // State
  const isLoading = ref(false)
  const loadingMessage = ref('')
  const currentView = ref('overview') // 'overview', 'charts', 'timeline', 'details'
  const selectedChartType = ref('bar') // 'bar', 'pie', 'line', 'doughnut'
  const ignoredEmojis = ref(new Set())

  // Getters
  const hasIgnoredEmojis = computed(() => ignoredEmojis.value.size > 0)

  const ignoredEmojisArray = computed(() => Array.from(ignoredEmojis.value))

  // Actions
  function setLoading(loading, message = '') {
    isLoading.value = loading
    loadingMessage.value = message
  }

  function setView(view) {
    currentView.value = view
  }

  function setChartType(chartType) {
    selectedChartType.value = chartType
  }

  function toggleIgnoreEmoji(emoji) {
    if (ignoredEmojis.value.has(emoji)) {
      ignoredEmojis.value.delete(emoji)
    } else {
      ignoredEmojis.value.add(emoji)
    }
    // Trigger reactivity by creating new Set
    ignoredEmojis.value = new Set(ignoredEmojis.value)
  }

  function clearIgnoredEmojis() {
    ignoredEmojis.value = new Set()
  }

  function isEmojiIgnored(emoji) {
    return ignoredEmojis.value.has(emoji)
  }

  return {
    // State
    isLoading,
    loadingMessage,
    currentView,
    selectedChartType,
    ignoredEmojis,

    // Getters
    hasIgnoredEmojis,
    ignoredEmojisArray,

    // Actions
    setLoading,
    setView,
    setChartType,
    toggleIgnoreEmoji,
    clearIgnoredEmojis,
    isEmojiIgnored
  }
})
