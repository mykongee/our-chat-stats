import { computed } from 'vue'
import { useThemeStore } from '@/stores/themeStore'

/**
 * Composable for integrating design system theme with Chart.js
 * Reads CSS custom properties and converts them to Chart.js configuration
 */
export function useChartTheme() {
  const themeStore = useThemeStore()

  /**
   * Get CSS custom property value from document root
   */
  function getCSSVariable(name) {
    return getComputedStyle(document.documentElement)
      .getPropertyValue(name)
      .trim()
  }

  /**
   * Chart.js color scheme based on current theme
   */
  const colors = computed(() => ({
    primary: getCSSVariable('--color-primary'),
    secondary: getCSSVariable('--color-secondary'),
    success: getCSSVariable('--color-success'),
    error: getCSSVariable('--color-error'),
    warning: getCSSVariable('--color-warning'),
    textPrimary: getCSSVariable('--color-text-primary'),
    textSecondary: getCSSVariable('--color-text-secondary'),
    border: getCSSVariable('--color-border'),
    background: getCSSVariable('--color-background'),
    surface: getCSSVariable('--color-surface'),
  }))

  /**
   * Generate an array of themed colors for multi-dataset charts
   * Uses primary color with varying opacity
   */
  const colorPalette = computed(() => {
    const base = colors.value.primary
    return [
      base,
      colors.value.secondary,
      addAlpha(base, 0.8),
      addAlpha(colors.value.secondary, 0.8),
      addAlpha(base, 0.6),
      addAlpha(colors.value.secondary, 0.6),
      addAlpha(base, 0.4),
      addAlpha(colors.value.secondary, 0.4),
    ]
  })

  /**
   * Chart.js default options that apply theme styling
   */
  const chartOptions = computed(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: colors.value.textPrimary,
          font: {
            family: getCSSVariable('--font-family-primary'),
            size: parseInt(getCSSVariable('--font-size-sm')),
          },
          padding: 12,
        },
      },
      tooltip: {
        backgroundColor: colors.value.surface,
        titleColor: colors.value.textPrimary,
        bodyColor: colors.value.textSecondary,
        borderColor: colors.value.border,
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        titleFont: {
          family: getCSSVariable('--font-family-primary'),
          size: parseInt(getCSSVariable('--font-size-sm')),
          weight: getCSSVariable('--font-weight-medium'),
        },
        bodyFont: {
          family: getCSSVariable('--font-family-primary'),
          size: parseInt(getCSSVariable('--font-size-xs')),
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: colors.value.textSecondary,
          font: {
            family: getCSSVariable('--font-family-primary'),
            size: parseInt(getCSSVariable('--font-size-xs')),
          },
        },
        grid: {
          color: addAlpha(colors.value.border, 0.5),
          borderColor: colors.value.border,
        },
      },
      y: {
        ticks: {
          color: colors.value.textSecondary,
          font: {
            family: getCSSVariable('--font-family-primary'),
            size: parseInt(getCSSVariable('--font-size-xs')),
          },
        },
        grid: {
          color: addAlpha(colors.value.border, 0.5),
          borderColor: colors.value.border,
        },
      },
    },
  }))

  /**
   * Add alpha channel to hex color
   */
  function addAlpha(hexColor, alpha) {
    // Handle hex color with or without #
    const hex = hexColor.replace('#', '')

    // Convert hex to RGB
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)

    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  /**
   * Create dataset configuration with theme colors
   */
  function createDataset(data, label, options = {}) {
    const baseColor = options.color || colors.value.primary
    const backgroundColor = options.backgroundColor || addAlpha(baseColor, 0.6)
    const borderColor = options.borderColor || baseColor

    return {
      label,
      data,
      backgroundColor,
      borderColor,
      borderWidth: options.borderWidth || 2,
      ...options,
    }
  }

  /**
   * Create multi-color dataset (for pie/doughnut charts)
   */
  function createMultiColorDataset(data, label, options = {}) {
    const backgroundColors = data.map((_, index) =>
      colorPalette.value[index % colorPalette.value.length]
    )

    return {
      label,
      data,
      backgroundColor: backgroundColors,
      borderColor: colors.value.background,
      borderWidth: options.borderWidth || 2,
      ...options,
    }
  }

  return {
    colors,
    colorPalette,
    chartOptions,
    createDataset,
    createMultiColorDataset,
    addAlpha,
    currentTheme: computed(() => themeStore.currentTheme),
  }
}
