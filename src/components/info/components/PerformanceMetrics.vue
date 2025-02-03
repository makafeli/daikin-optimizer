/**
 * Performance metrics display component
 */
<template>
  <v-card flat>
    <v-card-title class="text-subtitle-1">
      Performance Metrics
      <v-spacer></v-spacer>
      <v-menu location="bottom end">
        <template v-slot:activator="{ props }">
          <v-btn
            icon="mdi-clock-outline"
            variant="text"
            size="small"
            v-bind="props"
          ></v-btn>
        </template>
        <v-list density="compact">
          <v-list-item
            v-for="duration in chartDurations"
            :key="duration.value"
            :value="duration.value"
            @click="updateDuration(duration.value)"
          >
            <v-list-item-title>{{ duration.label }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-card-title>

    <v-card-text>
      <v-row dense>
        <v-col
          v-for="metric in metrics"
          :key="metric.id"
          cols="12"
          sm="6"
          md="4"
        >
          <v-card variant="outlined">
            <v-card-text>
              <!-- Metric Header -->
              <div class="d-flex align-center">
                <v-icon
                  :color="metric.color"
                  size="small"
                  class="mr-2"
                >
                  {{ metric.icon }}
                </v-icon>
                <span class="text-caption">{{ metric.label }}</span>
              </div>

              <!-- Metric Value -->
              <div class="d-flex align-center mt-1">
                <span class="text-h6">{{ formatValue(metric.value, metric.unit) }}</span>
                <!-- Trend Indicator -->
                <v-icon
                  v-if="metric.trend"
                  :icon="getTrendIcon(metric.trend)"
                  :color="getTrendColor(metric.trend)"
                  size="small"
                  class="ml-2"
                ></v-icon>
                <span
                  v-if="metric.change"
                  :class="getChangeClass(metric.change)"
                  class="text-caption ml-1"
                >
                  {{ formatChange(metric.change) }}
                </span>
              </div>
            </v-card-text>

            <!-- Mini Chart -->
            <div v-if="showChart" class="pa-2">
              <v-sparkline
                :value="getChartData(metric.id)"
                :color="metric.color"
                :line-width="2"
                :height="50"
                auto-draw
                smooth
              ></v-sparkline>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PerformanceMetric } from '../types'

const props = defineProps<{
  metrics: PerformanceMetric[]
  showChart?: boolean
}>()

const emit = defineEmits<{
  'update:duration': [value: string]
}>()

// Chart duration options
const chartDurations = [
  { label: 'Last Hour', value: '1h' },
  { label: '24 Hours', value: '24h' },
  { label: '7 Days', value: '7d' },
  { label: '30 Days', value: '30d' }
]

// Methods
const formatValue = (value: number, unit: string) => {
  return `${value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })} ${unit}`
}

const formatChange = (change: number) => {
  const sign = change > 0 ? '+' : ''
  return `${sign}${change.toFixed(1)}%`
}

const getTrendIcon = (trend: PerformanceMetric['trend']) => {
  switch (trend) {
    case 'up': return 'mdi-trending-up'
    case 'down': return 'mdi-trending-down'
    default: return 'mdi-trending-neutral'
  }
}

const getTrendColor = (trend: PerformanceMetric['trend']) => {
  switch (trend) {
    case 'up': return 'success'
    case 'down': return 'error'
    default: return 'grey'
  }
}

const getChangeClass = (change: number) => {
  if (change > 0) return 'text-success'
  if (change < 0) return 'text-error'
  return 'text-grey'
}

// Sample chart data - replace with real data
const getChartData = (metricId: string) => {
  // Generate sample data - replace with real data fetch
  return Array.from({ length: 20 }, () => Math.random() * 100)
}

const updateDuration = (duration: string) => {
  emit('update:duration', duration)
}
</script>