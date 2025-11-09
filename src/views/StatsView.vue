<script setup>
import { computed } from 'vue'
import { useChatStore } from '@/stores/chatStore'
import { useUiStore } from '@/stores/uiStore'
import MessageCountBarChart from '@/components/charts/MessageCountBarChart.vue'
import EmojiPieChart from '@/components/charts/EmojiPieChart.vue'
import TimelineChart from '@/components/charts/TimelineChart.vue'
import ActivityByDayChart from '@/components/charts/ActivityByDayChart.vue'
import ActivityByHourChart from '@/components/charts/ActivityByHourChart.vue'

const chatStore = useChatStore()
const uiStore = useUiStore()

const views = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'timeline', label: 'Timeline', icon: '📈' },
  { id: 'activity', label: 'Activity', icon: '⏰' },
  { id: 'emojis', label: 'Emojis', icon: '😊' }
]

function setView(viewId) {
  uiStore.setView(viewId)
}

const hasData = computed(() => chatStore.hasData)
</script>

<template>
  <div class="stats-view">
    <div v-if="!hasData" class="empty-state">
      <div class="empty-state__icon">📁</div>
      <h2 class="empty-state__title">No Data Yet</h2>
      <p class="empty-state__message">
        Upload an Instagram chat file to see visualizations
      </p>
    </div>

    <template v-else>
      <!-- View Switcher -->
      <div class="view-switcher">
        <button
          v-for="view in views"
          :key="view.id"
          :class="[
            'view-switcher__button',
            { 'view-switcher__button--active': uiStore.currentView === view.id }
          ]"
          @click="setView(view.id)"
        >
          <span class="view-switcher__icon">{{ view.icon }}</span>
          <span class="view-switcher__label">{{ view.label }}</span>
        </button>
      </div>

      <!-- Metadata Summary -->
      <div class="metadata">
        <div class="metadata__item">
          <span class="metadata__label">Conversation:</span>
          <span class="metadata__value">{{ chatStore.conversationTitle }}</span>
        </div>
        <div class="metadata__item">
          <span class="metadata__label">Total Messages:</span>
          <span class="metadata__value">{{ chatStore.totalMessages.toLocaleString() }}</span>
        </div>
        <div class="metadata__item">
          <span class="metadata__label">Participants:</span>
          <span class="metadata__value">{{ chatStore.participants.join(', ') }}</span>
        </div>
      </div>

      <!-- Overview View -->
      <div v-if="uiStore.currentView === 'overview'" class="charts-grid">
        <MessageCountBarChart />
        <EmojiPieChart :limit="8" />
      </div>

      <!-- Timeline View -->
      <div v-if="uiStore.currentView === 'timeline'" class="charts-grid">
        <TimelineChart group-by="day" />
        <TimelineChart group-by="month" />
      </div>

      <!-- Activity View -->
      <div v-if="uiStore.currentView === 'activity'" class="charts-grid">
        <ActivityByDayChart />
        <ActivityByHourChart />
      </div>

      <!-- Emojis View -->
      <div v-if="uiStore.currentView === 'emojis'" class="charts-grid">
        <EmojiPieChart :limit="10" />
        <div class="emoji-list">
          <h3 class="emoji-list__title">Top Emojis</h3>
          <div class="emoji-list__items">
            <div
              v-for="(item, index) in chatStore.topEmojis.slice(0, 20)"
              :key="item.emoji"
              class="emoji-item"
            >
              <span class="emoji-item__rank">{{ index + 1 }}</span>
              <span class="emoji-item__emoji">{{ item.emoji }}</span>
              <span class="emoji-item__count">{{ item.count }}</span>
              <button
                :class="[
                  'emoji-item__ignore',
                  { 'emoji-item__ignore--active': uiStore.isEmojiIgnored(item.emoji) }
                ]"
                @click="uiStore.toggleIgnoreEmoji(item.emoji)"
                :title="uiStore.isEmojiIgnored(item.emoji) ? 'Show' : 'Hide'"
              >
                {{ uiStore.isEmojiIgnored(item.emoji) ? '👁️' : '🚫' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.stats-view {
  width: 100%;
  max-width: var(--container-max-width);
  margin: 0 auto;
  padding: var(--spacing-xl);
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: var(--spacing-2xl);
}

.empty-state__icon {
  font-size: 4rem;
  margin-bottom: var(--spacing-lg);
}

.empty-state__title {
  font-family: var(--font-family-heading);
  font-size: var(--font-size-2xl);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-sm);
}

.empty-state__message {
  font-size: var(--font-size-md);
  color: var(--color-text-secondary);
}

/* View Switcher */
.view-switcher {
  display: flex;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-xl);
  padding: var(--spacing-sm);
  background: var(--color-surface);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--color-border);
  flex-wrap: wrap;
}

.view-switcher__button {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-md);
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--border-radius-sm);
  font-family: var(--font-family-primary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.view-switcher__button:hover {
  background: var(--color-background);
  color: var(--color-text-primary);
}

.view-switcher__button--active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.view-switcher__icon {
  font-size: var(--font-size-lg);
}

/* Metadata */
.metadata {
  display: flex;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
  padding: var(--spacing-lg);
  background: var(--color-surface);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--color-border);
  flex-wrap: wrap;
}

.metadata__item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.metadata__label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.metadata__value {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

/* Charts Grid */
.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  gap: var(--spacing-xl);
}

@media (max-width: 768px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }
}

/* Emoji List */
.emoji-list {
  padding: var(--spacing-lg);
  background: var(--color-surface);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
}

.emoji-list__title {
  font-family: var(--font-family-heading);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-md);
}

.emoji-list__items {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  max-height: 400px;
  overflow-y: auto;
}

.emoji-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  background: var(--color-background);
  border-radius: var(--border-radius-sm);
  transition: background var(--transition-fast);
}

.emoji-item:hover {
  background: var(--color-surface-alt, var(--color-background));
}

.emoji-item__rank {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-secondary);
  min-width: 2rem;
  text-align: right;
}

.emoji-item__emoji {
  font-size: var(--font-size-xl);
  min-width: 2rem;
  text-align: center;
}

.emoji-item__count {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  margin-left: auto;
}

.emoji-item__ignore {
  padding: var(--spacing-xs);
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  font-size: var(--font-size-sm);
  transition: all var(--transition-fast);
}

.emoji-item__ignore:hover {
  background: var(--color-background);
  border-color: var(--color-primary);
}

.emoji-item__ignore--active {
  background: var(--color-error);
  border-color: var(--color-error);
}
</style>
