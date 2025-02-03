&lt;template>
  &lt;v-card class="mb-4">
    &lt;v-card-title class="d-flex align-center">
      Heat Pump Information
      &lt;v-spacer>&lt;/v-spacer>
      &lt;v-btn
        icon="mdi-refresh"
        variant="text"
        @click="refreshInfo"
        :loading="loading"
      />
    &lt;/v-card-title>

    &lt;v-card-text>
      &lt;v-list>
        &lt;!-- Model Details -->
        &lt;v-list-subheader>Model Details&lt;/v-list-subheader>
        &lt;v-list-item>
          &lt;template v-slot:prepend>
            &lt;v-icon>mdi-information&lt;/v-icon>
          &lt;/template>
          &lt;v-list-item-title>{{ systemInfo.model || 'Not Available' }}&lt;/v-list-item-title>
          &lt;v-list-item-subtitle>Model Number&lt;/v-list-item-subtitle>
        &lt;/v-list-item>

        &lt;!-- System Specifications -->
        &lt;v-list-subheader>System Specifications&lt;/v-list-subheader>
        &lt;v-list-item v-for="(value, key) in systemSpecs" :key="key">
          &lt;template v-slot:prepend>
            &lt;v-icon>{{ getSpecIcon(key) }}&lt;/v-icon>
          &lt;/template>
          &lt;v-list-item-title>{{ value }}&lt;/v-list-item-title>
          &lt;v-list-item-subtitle>{{ formatSpecLabel(key) }}&lt;/v-list-item-subtitle>
        &lt;/v-list-item>

        &lt;!-- Zone Configuration -->
        &lt;v-list-subheader>Zone Configuration&lt;/v-list-subheader>
        &lt;v-list-item v-for="zone in zones" :key="zone.id">
          &lt;template v-slot:prepend>
            &lt;v-icon>mdi-thermostat&lt;/v-icon>
          &lt;/template>
          &lt;v-list-item-title>{{ zone.name }}&lt;/v-list-item-title>
          &lt;v-list-item-subtitle>
            {{ zone.type }} - {{ zone.setpoint }}°C
          &lt;/v-list-item-subtitle>
        &lt;/v-list-item>

        &lt;!-- Performance Metrics -->
        &lt;v-list-subheader>Performance Metrics&lt;/v-list-subheader>
        &lt;v-list-item v-for="metric in performanceMetrics" :key="metric.id">
          &lt;template v-slot:prepend>
            &lt;v-icon>{{ getMetricIcon(metric.type) }}&lt;/v-icon>
          &lt;/template>
          &lt;v-list-item-title>{{ metric.value }}{{ metric.unit }}&lt;/v-list-item-title>
          &lt;v-list-item-subtitle>{{ metric.label }}&lt;/v-list-item-subtitle>
        &lt;/v-list-item>
      &lt;/v-list>

      &lt;!-- Current Status -->
      &lt;v-card-subtitle class="mt-4">Current Status&lt;/v-card-subtitle>
      &lt;v-row dense>
        &lt;v-col v-for="status in currentStatus" :key="status.id" cols="6">
          &lt;v-chip
            :color="status.color"
            :prepend-icon="status.icon"
          >
            {{ status.label }}: {{ status.value }}
          &lt;/v-chip>
        &lt;/v-col>
      &lt;/v-row>
    &lt;/v-card-text>
  &lt;/v-card>
&lt;/template>

&lt;script setup>
import { ref, computed } from 'vue'
import { useSettingsStore } from '@/store/settingsStore'

const settingsStore = useSettingsStore()
const loading = ref(false)

// Computed properties
const systemInfo = computed(() => settingsStore.systemInfo)

const systemSpecs = computed(() => ({
  'heatingCapacity': '14 kW',
  'coolingCapacity': '18 kW',
  'backupHeater': '9 kW',
  'tankVolume': '230 L',
}))

const zones = computed(() => [
  {
    id: 1,
    name: 'Main Zone',
    type: 'Underfloor Heating',
    setpoint: settingsStore.currentSettings['2-0C'] || 'N/A'
  },
  {
    id: 2,
    name: 'Additional Zone',
    type: 'Radiator',
    setpoint: settingsStore.currentSettings['2-0D'] || 'N/A'
  }
])

const performanceMetrics = computed(() => [
  {
    id: 1,
    type: 'cop',
    label: 'Current COP',
    value: '4.5',
    unit: '',
    icon: 'mdi-lightning-bolt'
  },
  {
    id: 2,
    type: 'power',
    label: 'Power Consumption',
    value: '2.1',
    unit: 'kW',
    icon: 'mdi-flash'
  }
])

const currentStatus = computed(() => [
  {
    id: 1,
    label: 'Operation',
    value: 'Heating',
    color: 'red',
    icon: 'mdi-thermometer-high'
  },
  {
    id: 2,
    label: 'Tank',
    value: '58°C',
    color: 'blue',
    icon: 'mdi-water'
  },
  {
    id: 3,
    label: 'Outdoor',
    value: '12°C',
    color: 'green',
    icon: 'mdi-thermometer'
  },
  {
    id: 4,
    label: 'Flow Rate',
    value: '15 L/min',
    color: 'purple',
    icon: 'mdi-water-pump'
  }
])

// Methods
const getSpecIcon = (type) => {
  const icons = {
    heatingCapacity: 'mdi-heating-coil',
    coolingCapacity: 'mdi-snowflake',
    backupHeater: 'mdi-radiator',
    tankVolume: 'mdi-water-boiler'
  }
  return icons[type] || 'mdi-help'
}

const getMetricIcon = (type) => {
  const icons = {
    cop: 'mdi-lightning-bolt',
    power: 'mdi-flash',
    temperature: 'mdi-thermometer',
    pressure: 'mdi-gauge'
  }
  return icons[type] || 'mdi-help'
}

const formatSpecLabel = (key) => {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
}

const refreshInfo = async () => {
  loading.value = true
  try {
    // Here you would typically fetch updated info from the heat pump
    await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
    // Update store with new data
  } catch (error) {
    console.error('Failed to refresh heat pump info:', error)
  } finally {
    loading.value = false
  }
}
&lt;/script>

&lt;style scoped>
.v-list-item {
  min-height: 48px;
}

.v-chip {
  width: 100%;
}
&lt;/style>