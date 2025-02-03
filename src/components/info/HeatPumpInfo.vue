/**
 * Main HeatPumpInfo component
 */
<template>
  <v-card>
    <v-card-title class="d-flex align-center">
      Heat Pump Information
      <v-spacer></v-spacer>
      <v-btn
        icon="mdi-refresh"
        variant="text"
        :loading="loading"
        @click="refreshInfo"
      ></v-btn>
    </v-card-title>

    <v-card-text>
      <v-row>
        <!-- System Specifications -->
        <v-col cols="12" md="4">
          <system-specs :specifications="systemSpecs" />
        </v-col>

        <!-- Status Indicators -->
        <v-col cols="12" md="8">
          <status-indicators
            :indicators="statusIndicators"
            :loading="loading"
            @refresh="refreshInfo"
          />
        </v-col>

        <!-- Zone Information -->
        <v-col cols="12">
          <zone-info :zones="zones" />
        </v-col>

        <!-- Performance Metrics -->
        <v-col cols="12">
          <performance-metrics
            :metrics="performanceMetrics"
            :show-chart="config.showCharts"
            @update:duration="updateChartDuration"
          />
        </v-col>
      </v-row>
    </v-card-text>

    <!-- Error Alert -->
    <v-alert
      v-if="error"
      type="error"
      class="ma-4"
      closable
      @click:close="error = null"
    >
      {{ error }}
    </v-alert>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useSettingsStore } from '@/store/settingsStore'
import { useDaikinApi } from '@/api/composable'
import type {
  SystemSpecification,
  ZoneInfo,
  PerformanceMetric,
  StatusIndicator,
  InfoPanelConfig
} from './types'
import SystemSpecs from './components/SystemSpecs.vue'
import StatusIndicators from './components/StatusIndicators.vue'
import ZoneInfo from './components/ZoneInfo.vue'
import PerformanceMetrics from './components/PerformanceMetrics.vue'

// Props
const props = withDefaults(defineProps<{
  config?: Partial<InfoPanelConfig>
}>(), {
  config: () => ({
    refreshInterval: 30000, // 30 seconds
    showCharts: true,
    showTrends: true,
    chartDuration: '1h'
  })
})

// Store & API
const settingsStore = useSettingsStore()
const api = useDaikinApi()

// State
const loading = ref(false)
const error = ref<string | null>(null)
const refreshTimer = ref<number | null>(null)

// Computed
const systemSpecs = computed<SystemSpecification[]>(() => {
  const status = settingsStore.systemStatus
  if (!status) return []

  return [
    {
      id: 'model',
      label: 'Model',
      value: settingsStore.systemInfo.model,
      icon: 'mdi-information',
      color: 'primary'
    },
    {
      id: 'heating-capacity',
      label: 'Heating Capacity',
      value: 14,
      unit: 'kW',
      icon: 'mdi-heating-coil',
      color: 'error'
    },
    {
      id: 'cooling-capacity',
      label: 'Cooling Capacity',
      value: 18,
      unit: 'kW',
      icon: 'mdi-snowflake',
      color: 'info'
    },
    {
      id: 'tank-volume',
      label: 'Tank Volume',
      value: 230,
      unit: 'L',
      icon: 'mdi-water-boiler',
      color: 'primary'
    }
  ]
})

const statusIndicators = computed<StatusIndicator[]>(() => {
  const status = settingsStore.systemStatus
  const metrics = settingsStore.metrics
  if (!status || !metrics) return []

  return [
    {
      id: 'operation',
      label: 'Operation Mode',
      value: status.mode,
      status: status.active ? 'normal' : 'inactive',
      icon: 'mdi-power'
    },
    {
      id: 'outdoor-temp',
      label: 'Outdoor Temperature',
      value: metrics.temperatures.outdoor,
      unit: '°C',
      status: 'normal',
      icon: 'mdi-thermometer'
    },
    {
      id: 'tank-temp',
      label: 'Tank Temperature',
      value: metrics.temperatures.tank || 0,
      unit: '°C',
      status: 'normal',
      icon: 'mdi-water'
    },
    {
      id: 'flow-rate',
      label: 'Flow Rate',
      value: metrics.flow.rate,
      unit: 'L/min',
      status: 'normal',
      icon: 'mdi-water-pump'
    },
    {
      id: 'pressure',
      label: 'System Pressure',
      value: metrics.pressure,
      unit: 'bar',
      status: 'normal',
      icon: 'mdi-gauge'
    },
    {
      id: 'cop',
      label: 'Current COP',
      value: metrics.power.cop,
      status: 'normal',
      icon: 'mdi-lightning-bolt'
    }
  ]
})

const zones = computed<ZoneInfo[]>(() => {
  const status = settingsStore.systemStatus
  if (!status) return []

  return [
    {
      id: 'main',
      name: 'Main Zone',
      type: 'Underfloor Heating',
      temperature: 22.5,
      targetTemperature: 23.0,
      humidity: 45,
      status: 'active'
    },
    {
      id: 'additional',
      name: 'Additional Zone',
      type: 'Radiator',
      temperature: 21.8,
      targetTemperature: 22.0,
      status: 'idle'
    }
  ]
})

const performanceMetrics = computed<PerformanceMetric[]>(() => {
  const metrics = settingsStore.metrics
  if (!metrics) return []

  return [
    {
      id: 'power-consumption',
      label: 'Power Consumption',
      value: metrics.power.consumption,
      unit: 'kW',
      icon: 'mdi-flash',
      color: 'error',
      trend: 'down',
      change: -5.2
    },
    {
      id: 'cop-trend',
      label: 'COP',
      value: metrics.power.cop,
      unit: '',
      icon: 'mdi-lightning-bolt',
      color: 'success',
      trend: 'up',
      change: 2.8
    },
    {
      id: 'flow-temperature',
      label: 'Flow Temperature',
      value: metrics.flow.temperature,
      unit: '°C',
      icon: 'mdi-thermometer',
      color: 'primary',
      trend: 'stable'
    }
  ]
})

// Methods
const refreshInfo = async () => {
  loading.value = true
  error.value = null

  try {
    const status = await api.getStatus()
    if (status) {
      settingsStore.updateSystemStatus(status)
    }
  } catch (err) {
    error.value = 'Failed to refresh system information'
    console.error('Error refreshing info:', err)
  } finally {
    loading.value = false
  }
}

const updateChartDuration = (duration: InfoPanelConfig['chartDuration']) => {
  // Implementation for updating chart duration
  console.log('Updating chart duration:', duration)
}

const startRefreshTimer = () => {
  refreshTimer.value = window.setInterval(refreshInfo, props.config.refreshInterval)
}

const stopRefreshTimer = () => {
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value)
    refreshTimer.value = null
  }
}

// Lifecycle
onMounted(() => {
  refreshInfo()
  startRefreshTimer()
})

onBeforeUnmount(() => {
  stopRefreshTimer()
})
</script>