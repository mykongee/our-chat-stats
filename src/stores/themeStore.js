import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { themes } from '@/design-system/themes'

const STORAGE_KEY = 'our-chat-stats:theme'

export const useThemeStore = defineStore('theme', () => {
  // State
  const currentThemeId = ref('love-letter') // Default theme

  // Getters
  const currentTheme = computed(() => {
    return themes.find(t => t.id === currentThemeId.value) || themes[0]
  })

  const availableThemes = computed(() => themes)

  // Actions
  function setTheme(themeId) {
    const theme = themes.find(t => t.id === themeId)
    if (theme) {
      currentThemeId.value = themeId
      applyTheme(theme)
      saveToLocalStorage(themeId)
    }
  }

  function applyTheme(theme) {
    // Remove all theme classes
    const html = document.documentElement
    themes.forEach(t => {
      html.classList.remove(`theme-${t.id}`)
    })

    // Add current theme class
    html.classList.add(`theme-${theme.id}`)
  }

  function saveToLocalStorage(themeId) {
    try {
      localStorage.setItem(STORAGE_KEY, themeId)
    } catch (error) {
      console.warn('Failed to save theme preference:', error)
    }
  }

  function loadFromLocalStorage() {
    try {
      const savedThemeId = localStorage.getItem(STORAGE_KEY)
      if (savedThemeId && themes.find(t => t.id === savedThemeId)) {
        setTheme(savedThemeId)
      } else {
        // Apply default theme
        applyTheme(currentTheme.value)
      }
    } catch (error) {
      console.warn('Failed to load theme preference:', error)
      // Apply default theme
      applyTheme(currentTheme.value)
    }
  }

  function initializeTheme() {
    loadFromLocalStorage()
  }

  return {
    // State
    currentThemeId,

    // Getters
    currentTheme,
    availableThemes,

    // Actions
    setTheme,
    initializeTheme
  }
})
