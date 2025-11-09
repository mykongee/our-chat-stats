<script setup>
import { computed } from 'vue'
import { Pie } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, ArcElement } from 'chart.js'
import { useChatStore } from '@/stores/chatStore'
import { useUiStore } from '@/stores/uiStore'
import { useChartTheme } from '@/composables/useChartTheme'
import { transformEmojiCount } from '@/utils/chartTransforms'

// Register Chart.js components
ChartJS.register(Title, Tooltip, Legend, ArcElement)

const props = defineProps({
  limit: {
    type: Number,
    default: 10
  }
})

const chatStore = useChatStore()
const uiStore = useUiStore()
const { chartOptions, createMultiColorDataset, colors } = useChartTheme()

const chartData = computed(() => {
  const { labels, data } = transformEmojiCount(
    chatStore.totalEmojiCount,
    props.limit,
    uiStore.ignoredEmojis
  )

  return {
    labels,
    datasets: [createMultiColorDataset(data, 'Emoji Usage')]
  }
})

const options = computed(() => ({
  ...chartOptions.value,
  plugins: {
    ...chartOptions.value.plugins,
    title: {
      display: true,
      text: `Top ${props.limit} Emojis`,
      color: colors.value.textPrimary,
      font: {
        size: 18,
        weight: 'bold'
      }
    },
    legend: {
      ...chartOptions.value.plugins.legend,
      display: true,
      position: 'right'
    }
  }
}))
</script>

<template>
  <div class="chart-container">
    <Pie :data="chartData" :options="options" />
  </div>
</template>

<style scoped>
.chart-container {
  position: relative;
  height: 400px;
  width: 100%;
  padding: var(--spacing-lg);
  background: var(--color-surface);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
}
</style>
