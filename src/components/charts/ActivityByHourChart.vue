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
import { transformActivityByHourOfDay } from '@/utils/chartTransforms'

// Register Chart.js components
ChartJS.register(Title, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale)

const chatStore = useChatStore()
const { chartOptions, createDataset, colors } = useChartTheme()

const chartData = computed(() => {
  const { labels, data } = transformActivityByHourOfDay(chatStore.messages)

  return {
    labels,
    datasets: [
      createDataset(data, 'Messages', {
        backgroundColor: colors.value.success,
        borderColor: colors.value.success,
        fill: false,
        tension: 0.3,
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
      text: 'Activity by Hour of Day',
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
        text: 'Hour',
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
