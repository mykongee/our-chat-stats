<script setup>
import { useThemeStore } from '@/stores/themeStore'

const themeStore = useThemeStore()

function handleThemeChange(event) {
  themeStore.setTheme(event.target.value)
}
</script>

<template>
  <div class="theme-switcher">
    <label for="theme-select" class="theme-switcher__label">
      Theme:
    </label>
    <select
      id="theme-select"
      :value="themeStore.currentThemeId"
      @change="handleThemeChange"
      class="theme-switcher__select"
    >
      <option
        v-for="theme in themeStore.availableThemes"
        :key="theme.id"
        :value="theme.id"
      >
        {{ theme.name }}
      </option>
    </select>
  </div>
</template>

<style scoped>
.theme-switcher {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-surface);
  border-radius: var(--border-radius-sm);
  border: 1px solid var(--color-border);
}

.theme-switcher__label {
  font-family: var(--font-family-primary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.theme-switcher__select {
  padding: var(--spacing-xs) var(--spacing-sm);
  font-family: var(--font-family-primary);
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
  outline: none;
}

.theme-switcher__select:hover {
  border-color: var(--color-primary);
}

.theme-switcher__select:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb), 0.1);
}
</style>
