<script setup>
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale
} from 'chart.js'
import { useChatStore } from '@/stores/chatStore'
import { useChartTheme } from '@/composables/useChartTheme'
import { transformMessagesTimeline } from '@/utils/chartTransforms'

// Register Chart.js components
ChartJS.register(Title, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale)

const props = defineProps({
  groupBy: {
    type: String,
    default: 'day',
    validator: (value) => ['hour', 'day', 'week', 'month'].includes(value)
  }
})

const chatStore = useChatStore()
const { chartOptions, createDataset, colors } = useChartTheme()

const chartData = computed(() => {
  const { labels, data } = transformMessagesTimeline(chatStore.messages, props.groupBy)

  return {
    labels,
    datasets: [
      createDataset(data, 'Messages', {
        backgroundColor: colors.value.primary,
        borderColor: colors.value.primary,
        fill: true,
        tension: 0.4,
      })
    ]
  }
})

const options = computed(() => ({
  ...chartOptions.value,
  plugins: {
    ...chartOptions.value.plugins,
    title: {
      display: true,
      text: `Messages Over Time (${props.groupBy})`,
      color: colors.value.textPrimary,
      font: {
        size: 18,
        weight: 'bold'
      }
    },
    legend: {
      display: false
    }
  },
  scales: {
    ...chartOptions.value.scales,
    y: {
      ...chartOptions.value.scales.y,
      beginAtZero: true,
      title: {
        display: true,
        text: 'Message Count',
        color: colors.value.textSecondary
      }
    },
    x: {
      ...chartOptions.value.scales.x,
      title: {
        display: true,
        text: 'Time',
        color: colors.value.textSecondary
      }
    }
  }
}))
</script>

<template>
  <div class="chart-container">
    <Line :data="chartData" :options="options" />
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
