# Data Visualization Layer - Technical Specification

## Overview

This visualization layer transforms parsed chat data into interactive visual representations. The primary goal is to enable **seamless switching between visualization types** (bar chart ↔ pie chart ↔ timeline) while maintaining our core DX principle:

> **Start simple. Add complexity only when the simple version breaks.**

---

## Core Insight: View-Agnostic Data

**The Problem:**
```
Bad: Parser → BarChartData → BarChart
                ↓
          (locked in, can't switch)
```

**The Solution:**
```
Good: Parser → SharedData → BarChart
                   ↓
                PieChart
                   ↓
               Timeline
```

**Analogy:** Like keeping ingredients (flour, eggs, sugar) instead of a finished cake. You can make whatever you want.

**Technical:** Keep data in a simple, reusable format. Transform it when rendering, not when storing.

---

## Starting Simple: One Chart

### Step 1: What Does the Parser Give Us?

```javascript
// From parser (already built)
{
  messages: Message[],
  statistics: {
    messageCountByUser: {
      "Alice": 75,
      "Bob": 70
    },
    emojiCountByUser: {
      "Alice": { "👋": 3, "😊": 5 },
      "Bob": { "👍": 4, "😂": 7 }
    },
    totalEmojiCount: {
      "👋": 3,
      "😊": 5,
      "👍": 4,
      "😂": 7
    }
  }
}
```

### Step 2: Render a Bar Chart (Simplest Possible)

```vue
<!-- src/components/visualizations/MessageBarChart.vue -->
<script setup>
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import { useChatStore } from '@/stores/chatStore'
import { useChartTheme } from '@/composables/useChartTheme'

const chatStore = useChatStore()
const { chartColors } = useChartTheme()

// Direct transformation - no fancy adapters yet
const chartData = computed(() => {
  const stats = chatStore.statistics.messageCountByUser

  return {
    labels: Object.keys(stats),
    datasets: [{
      label: 'Messages Sent',
      data: Object.values(stats),
      backgroundColor: chartColors.value.primary
    }]
  })
})

const options = {
  responsive: true,
  plugins: {
    legend: { display: false }
  }
}
</script>

<template>
  <div class="chart-container">
    <h2>Messages by User</h2>
    <Bar :data="chartData" :options="options" />
  </div>
</template>

<style scoped>
.chart-container {
  background: var(--color-surface);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-md);
}
</style>
```

**That's it.** This works. It's simple. It uses design tokens. Ship it.

---

## Theme Integration: Making Charts Beautiful

### The Challenge

Chart libraries (Chart.js, etc.) don't use CSS variables directly. We need to bridge our design tokens to chart configs.

### The Solution: useChartTheme Composable

```javascript
// src/composables/useChartTheme.js

import { computed } from 'vue'
import { useThemeStore } from '@/stores/themeStore'

export function useChartTheme() {
  const themeStore = useThemeStore()

  // Read CSS variables when theme changes
  const chartColors = computed(() => {
    const root = document.documentElement
    const styles = getComputedStyle(root)

    return {
      primary: styles.getPropertyValue('--color-primary').trim(),
      secondary: styles.getPropertyValue('--color-secondary').trim(),
      text: styles.getPropertyValue('--color-text-primary').trim(),
      textSecondary: styles.getPropertyValue('--color-text-secondary').trim(),
      border: styles.getPropertyValue('--color-border').trim()
    }
  })

  const chartFonts = computed(() => {
    const root = document.documentElement
    const styles = getComputedStyle(root)

    return {
      family: styles.getPropertyValue('--font-family-primary').trim(),
      size: parseInt(styles.getPropertyValue('--font-size-md')) || 14
    }
  })

  // Standard options that work with all charts
  const baseOptions = computed(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: chartColors.value.text,
          font: {
            family: chartFonts.value.family,
            size: chartFonts.value.size
          }
        }
      },
      tooltip: {
        backgroundColor: 'var(--color-surface)',
        titleColor: chartColors.value.text,
        bodyColor: chartColors.value.textSecondary,
        borderColor: chartColors.value.border,
        borderWidth: 1
      }
    },
    scales: {
      x: {
        ticks: { color: chartColors.value.textSecondary },
        grid: { color: chartColors.value.border }
      },
      y: {
        ticks: { color: chartColors.value.textSecondary },
        grid: { color: chartColors.value.border }
      }
    }
  }))

  return {
    chartColors,
    chartFonts,
    baseOptions
  }
}
```

**Usage:**
```javascript
const { baseOptions } = useChartTheme()

// Merge with your custom options
const options = computed(() => ({
  ...baseOptions.value,
  // Your custom overrides
  plugins: {
    ...baseOptions.value.plugins,
    legend: { display: false }
  }
}))
```

**Result:** Theme changes automatically apply to all charts. No work needed.

---

## Adding View Switching: When You Have 2+ Charts

### The Pattern Emerges

You now have:
- MessageBarChart.vue
- MessagePieChart.vue

Both need the same data but in different formats. Time to extract the transformation logic.

### Step 1: Extract Transform Functions

```javascript
// src/utils/chartTransforms.js

/**
 * Transforms user message counts into bar chart format
 */
export function toBarChartData(messageCountByUser, colors) {
  return {
    labels: Object.keys(messageCountByUser),
    datasets: [{
      label: 'Messages',
      data: Object.values(messageCountByUser),
      backgroundColor: colors.primary
    }]
  }
}

/**
 * Transforms user message counts into pie chart format
 */
export function toPieChartData(messageCountByUser, colors) {
  const users = Object.keys(messageCountByUser)
  const counts = Object.values(messageCountByUser)

  return {
    labels: users,
    datasets: [{
      data: counts,
      backgroundColor: [colors.primary, colors.secondary]
    }]
  }
}

/**
 * Transforms emoji counts into bar chart format
 */
export function toEmojiBarChart(emojiCounts, colors) {
  // Sort by count, take top 10
  const sorted = Object.entries(emojiCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)

  return {
    labels: sorted.map(([emoji]) => emoji),
    datasets: [{
      label: 'Times Used',
      data: sorted.map(([, count]) => count),
      backgroundColor: colors.primary
    }]
  }
}
```

**Why functions, not classes?** Simple. Testable. Composable. No state to manage.

### Step 2: Create Generic Chart Components

```vue
<!-- src/components/visualizations/BarChart.vue -->
<script setup>
import { Bar } from 'vue-chartjs'
import { useChartTheme } from '@/composables/useChartTheme'

const props = defineProps({
  data: { type: Object, required: true },
  title: { type: String, default: '' },
  options: { type: Object, default: () => ({}) }
})

const { baseOptions } = useChartTheme()

const mergedOptions = computed(() => ({
  ...baseOptions.value,
  ...props.options
}))
</script>

<template>
  <div class="chart-wrapper">
    <h3 v-if="title" class="chart-title">{{ title }}</h3>
    <Bar :data="data" :options="mergedOptions" />
  </div>
</template>

<style scoped>
.chart-wrapper {
  background: var(--color-surface);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-md);
  min-height: 300px;
}

.chart-title {
  font-family: var(--font-family-heading);
  font-size: var(--font-size-lg);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-md);
}
</style>
```

```vue
<!-- src/components/visualizations/PieChart.vue -->
<script setup>
import { Pie } from 'vue-chartjs'
import { useChartTheme } from '@/composables/useChartTheme'

const props = defineProps({
  data: { type: Object, required: true },
  title: { type: String, default: '' },
  options: { type: Object, default: () => ({}) }
})

const { baseOptions } = useChartTheme()

const mergedOptions = computed(() => ({
  ...baseOptions.value,
  ...props.options,
  // Pie charts don't have axes
  scales: undefined
}))
</script>

<template>
  <div class="chart-wrapper">
    <h3 v-if="title" class="chart-title">{{ title }}</h3>
    <Pie :data="data" :options="mergedOptions" />
  </div>
</template>

<style scoped>
.chart-wrapper {
  background: var(--color-surface);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-md);
  min-height: 300px;
}

.chart-title {
  font-family: var(--font-family-heading);
  font-size: var(--font-size-lg);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-md);
}
</style>
```

### Step 3: Build the View Switcher

```vue
<!-- src/views/StatsView.vue -->
<script setup>
import { ref, computed } from 'vue'
import { useChatStore } from '@/stores/chatStore'
import { useChartTheme } from '@/composables/useChartTheme'
import { toBarChartData, toPieChartData } from '@/utils/chartTransforms'
import BarChart from '@/components/visualizations/BarChart.vue'
import PieChart from '@/components/visualizations/PieChart.vue'

const chatStore = useChatStore()
const { chartColors } = useChartTheme()

const currentView = ref('bar')

const chartData = computed(() => {
  const stats = chatStore.statistics.messageCountByUser

  if (currentView.value === 'bar') {
    return toBarChartData(stats, chartColors.value)
  } else {
    return toPieChartData(stats, chartColors.value)
  }
})

const chartComponent = computed(() => {
  return currentView.value === 'bar' ? BarChart : PieChart
})

function switchView(view) {
  currentView.value = view
}
</script>

<template>
  <div class="stats-view">
    <!-- View Switcher -->
    <div class="view-switcher">
      <button
        :class="{ active: currentView === 'bar' }"
        @click="switchView('bar')"
      >
        📊 Bar Chart
      </button>
      <button
        :class="{ active: currentView === 'pie' }"
        @click="switchView('pie')"
      >
        🥧 Pie Chart
      </button>
    </div>

    <!-- Dynamic Chart -->
    <transition name="fade" mode="out-in">
      <component
        :is="chartComponent"
        :key="currentView"
        :data="chartData"
        title="Messages by User"
      />
    </transition>
  </div>
</template>

<style scoped>
.stats-view {
  padding: var(--spacing-xl);
  max-width: var(--container-max-width);
  margin: 0 auto;
}

.view-switcher {
  display: flex;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-lg);
}

.view-switcher button {
  padding: var(--spacing-sm) var(--spacing-md);
  border: 2px solid var(--color-border);
  border-radius: var(--border-radius-sm);
  background: var(--color-surface);
  color: var(--color-text-primary);
  font-family: var(--font-family-primary);
  font-size: var(--font-size-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.view-switcher button:hover {
  border-color: var(--color-primary);
}

.view-switcher button.active {
  background: var(--color-primary);
  color: var(--color-background);
  border-color: var(--color-primary);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--transition-normal);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
```

**That's the core pattern.** Transform → Component → Switch. Clean. Simple. Works.

---

## When to Add Complexity: Progressive Enhancement

### Phase 1 (You Are Here)
**Current:** Direct transforms, simple switching

**Good for:** 2-5 different visualizations

**Add complexity when:** You have 5+ charts and notice repeated code

### Phase 2: Multiple Metrics
**Trigger:** User wants to switch between "Messages" and "Emojis" too

**Solution:** Add a config object

```javascript
const config = ref({
  metric: 'messages', // or 'emojis'
  view: 'bar' // or 'pie'
})

const chartData = computed(() => {
  const stats = config.value.metric === 'messages'
    ? chatStore.statistics.messageCountByUser
    : chatStore.statistics.totalEmojiCount

  if (config.value.view === 'bar') {
    return toBarChartData(stats, chartColors.value)
  } else {
    return toPieChartData(stats, chartColors.value)
  }
})
```

**Still simple.** Just one more level of indirection.

### Phase 3: Transform Registry
**Trigger:** You have 10+ transform functions and it's getting messy

**Solution:** Organize into a registry

```javascript
// src/utils/chartTransforms.js

export const TRANSFORMS = {
  bar: {
    messages: toBarChartData,
    emojis: toEmojiBarChart
  },
  pie: {
    messages: toPieChartData,
    emojis: toEmojiPieChart
  },
  line: {
    messagesOverTime: toLineChartData
  }
}

// Usage
const transform = TRANSFORMS[config.view][config.metric]
const chartData = transform(stats, chartColors.value)
```

**When to do this:** When you actually have 10+ transforms. Not before.

### Phase 4: Caching
**Trigger:** View switching feels slow with large datasets

**Solution:** Cache transformed data

```javascript
const cache = new Map()

const chartData = computed(() => {
  const cacheKey = `${config.view}-${config.metric}`

  if (cache.has(cacheKey)) {
    return cache.get(cacheKey)
  }

  const data = transform(stats, chartColors.value)
  cache.set(cacheKey, data)
  return data
})

// Clear cache when source data changes
watch(() => chatStore.statistics, () => {
  cache.clear()
})
```

**When to do this:** When you measure and prove it's slow. Not before.

---

## Chart Type Design Patterns

### Pattern 1: Comparison (Bar, Pie)
**Use for:** User A vs User B, Emoji X vs Emoji Y

**Data shape:**
```javascript
{
  labels: ['Alice', 'Bob'],
  datasets: [{ data: [75, 70] }]
}
```

### Pattern 2: Trend (Line, Area)
**Use for:** Messages over time

**Data shape:**
```javascript
{
  labels: ['Jan', 'Feb', 'Mar'],
  datasets: [{ data: [10, 20, 15] }]
}
```

### Pattern 3: Distribution (Heatmap, Scatter)
**Use for:** Message frequency by hour/day

**Data shape:**
```javascript
{
  datasets: [{
    data: [
      { x: 'Monday', y: '10am', value: 5 },
      { x: 'Monday', y: '11am', value: 8 }
    ]
  }]
}
```

**Key insight:** If your data doesn't fit one of these patterns, you probably need a custom visualization.

---

## Adding Design Tokens for Charts

### Extend Theme Definitions

```javascript
// src/design-system/tokens/love-letter.js

export const loveLetterTheme = {
  // ... existing tokens

  tokens: {
    colors: {
      // ... existing colors

      // Chart-specific colors (for multi-series charts)
      chartColor1: '#FFB6C1', // Primary
      chartColor2: '#E6A8D7', // Secondary
      chartColor3: '#B4E7CE', // Tertiary
      chartColor4: '#FFE4B5', // Quaternary
    },

    // ... rest of tokens
  }
}
```

### Using Multiple Colors

```javascript
export function toMultiSeriesBarChart(data, colors) {
  const colorPalette = [
    colors.chartColor1,
    colors.chartColor2,
    colors.chartColor3,
    colors.chartColor4
  ]

  return {
    labels: data.labels,
    datasets: data.series.map((series, index) => ({
      label: series.name,
      data: series.values,
      backgroundColor: colorPalette[index % colorPalette.length]
    }))
  }
}
```

---

## Error Handling

### No Data
```vue
<template>
  <div v-if="!chatStore.hasData" class="empty-state">
    <p>Upload a chat to see visualizations</p>
    <FileUploadButton />
  </div>
  <div v-else>
    <component :is="chartComponent" :data="chartData" />
  </div>
</template>
```

### Insufficient Data
```javascript
function validateData(data, minPoints = 2) {
  const dataPoints = Object.keys(data).length

  if (dataPoints < minPoints) {
    return {
      valid: false,
      message: `Need at least ${minPoints} data points`
    }
  }

  return { valid: true }
}
```

### Chart Load Failures
```vue
<script setup>
import { onErrorCaptured } from 'vue'

const error = ref(null)

onErrorCaptured((err) => {
  error.value = err.message
  return false // Stop propagation
})
</script>

<template>
  <div v-if="error" class="error-state">
    <p>Could not load chart: {{ error }}</p>
  </div>
  <component v-else :is="chartComponent" :data="chartData" />
</template>
```

---

## Testing Strategy

### Test Transform Functions (Pure Functions)

```javascript
// tests/chartTransforms.spec.js

import { describe, it, expect } from 'vitest'
import { toBarChartData } from '@/utils/chartTransforms'

describe('toBarChartData', () => {
  it('transforms message counts correctly', () => {
    const input = {
      'Alice': 10,
      'Bob': 15
    }
    const colors = { primary: '#FFB6C1' }

    const result = toBarChartData(input, colors)

    expect(result.labels).toEqual(['Alice', 'Bob'])
    expect(result.datasets[0].data).toEqual([10, 15])
    expect(result.datasets[0].backgroundColor).toBe('#FFB6C1')
  })

  it('handles empty data', () => {
    const result = toBarChartData({}, { primary: '#000' })

    expect(result.labels).toEqual([])
    expect(result.datasets[0].data).toEqual([])
  })

  it('sorts emojis by count', () => {
    const input = {
      '😊': 5,
      '👋': 10,
      '❤️': 3
    }

    const result = toEmojiBarChart(input, { primary: '#000' })

    expect(result.labels[0]).toBe('👋') // Highest count first
  })
})
```

### Test Theme Integration

```javascript
describe('useChartTheme', () => {
  it('reads CSS variables', () => {
    document.documentElement.style.setProperty('--color-primary', '#FFB6C1')

    const { chartColors } = useChartTheme()

    expect(chartColors.value.primary).toBe('#FFB6C1')
  })

  it('updates when theme changes', async () => {
    const themeStore = useThemeStore()
    const { chartColors } = useChartTheme()

    await themeStore.setTheme('minimal')

    expect(chartColors.value.primary).not.toBe('#FFB6C1')
  })
})
```

### Test View Switching (Integration)

```javascript
describe('View Switching', () => {
  it('switches between bar and pie', async () => {
    const wrapper = mount(StatsView)

    expect(wrapper.findComponent(BarChart).exists()).toBe(true)

    await wrapper.find('[data-view="pie"]').trigger('click')

    expect(wrapper.findComponent(PieChart).exists()).toBe(true)
    expect(wrapper.findComponent(BarChart).exists()).toBe(false)
  })
})
```

**What not to test:**
- Chart library internals (that's their job)
- CSS rendering (use visual regression tests)
- Exact pixel positions

---

## Responsive Design

### Simple Breakpoint Strategy

```javascript
// src/composables/useResponsiveChart.js

import { ref, onMounted, onUnmounted } from 'vue'

export function useResponsiveChart() {
  const isMobile = ref(window.innerWidth < 768)

  const updateSize = () => {
    isMobile.value = window.innerWidth < 768
  }

  onMounted(() => {
    window.addEventListener('resize', updateSize)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', updateSize)
  })

  return { isMobile }
}
```

### Mobile Adaptations

```vue
<script setup>
const { isMobile } = useResponsiveChart()

const options = computed(() => ({
  ...baseOptions.value,
  plugins: {
    legend: {
      display: !isMobile.value // Hide legend on mobile
    }
  }
}))
</script>
```

---

## Implementation Checklist

### Phase 1: Foundation (Start Here)
- [ ] Install chart library (Chart.js + vue-chartjs)
- [ ] Create `useChartTheme` composable
- [ ] Add chart design tokens to themes
- [ ] Create one transform function (bar chart)
- [ ] Create one chart component (BarChart)
- [ ] Render it in a view

### Phase 2: View Switching
- [ ] Add second transform (pie chart)
- [ ] Create second component (PieChart)
- [ ] Build view switcher UI
- [ ] Add transitions

### Phase 3: More Visualizations
- [ ] Add emoji bar chart transform
- [ ] Add timeline/line chart
- [ ] Add metric selector (messages vs emojis)
- [ ] Handle empty states

### Phase 4: Polish
- [ ] Responsive behavior
- [ ] Error boundaries
- [ ] Loading states
- [ ] Tooltips customization
- [ ] Accessibility (keyboard nav)

### Phase 5: Testing
- [ ] Unit tests for transforms
- [ ] Integration tests for switching
- [ ] Theme integration tests
- [ ] Visual regression tests (optional)

---

## Future Enhancements (When Needed)

### Interactive Features
- Click to drill down
- Hover for details
- Filter by date range
- Compare time periods

### Advanced Visualizations
- Heatmap (message patterns by hour/day)
- Radar chart (multi-dimensional comparison)
- Word cloud (common phrases)
- Network graph (conversation flow)

### Export & Sharing
- Download chart as PNG
- Share chart URL
- Export data as CSV

### Performance
- Virtual scrolling for large datasets
- Web Workers for transforms
- Caching strategies

**Key principle:** Build these when users ask for them, not because they sound cool.

---

## Success Metrics

### Good DX (How You'll Know It Works)
- ✅ Adding a new chart type takes <30 minutes
- ✅ Theme change affects all charts automatically
- ✅ View switching feels instant (<100ms)
- ✅ Transform functions are easy to test
- ✅ Components are <50 lines of code

### Good UX (How Users Will Know It Works)
- ✅ Charts match the theme aesthetic
- ✅ Switching views is smooth and fast
- ✅ Charts are readable on mobile
- ✅ Data makes sense at a glance
- ✅ Interactions feel natural

---

## Key Takeaways

1. **Start with one chart** - Get it working, then generalize
2. **Transform functions are pure** - Easy to test, easy to compose
3. **Components are thin wrappers** - Logic lives in transforms
4. **Theme integration is automatic** - CSS variables + computed values
5. **Add complexity progressively** - When you feel the pain, not before

**The Golden Rule:** If you can't explain the architecture in 5 minutes, it's too complex.

---

## Quick Reference: Adding a New Chart

```bash
# 1. Write the transform function
# src/utils/chartTransforms.js
export function toNewChartData(sourceData, colors) {
  return {
    labels: ...,
    datasets: [...]
  }
}

# 2. Create the component (copy BarChart.vue)
# src/components/visualizations/NewChart.vue
<script setup>
import { NewChartType } from 'vue-chartjs'
// ... same pattern as BarChart
</script>

# 3. Add to view switcher
# src/views/StatsView.vue
import NewChart from '@/components/visualizations/NewChart.vue'

const CHARTS = {
  bar: BarChart,
  pie: PieChart,
  new: NewChart  // Add this line
}
```

**Time to implement:** 15-30 minutes

**That's the entire visualization architecture.**
