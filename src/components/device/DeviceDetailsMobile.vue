/**
 * Mobile-optimized device details view
 */
<template>
  <div class="device-details-mobile">
    <!-- Device Header -->
    <v-card class="mb-4">
      <v-card-item>
        <div class="d-flex align-center">
          <v-avatar
            :color="getDeviceStatusColor(device)"
            size="large"
            class="mr-4"
          >
            <v-icon
              :icon="getDeviceTypeIcon(device.deviceType)"
              size="32"
            ></v-icon>
          </v-avatar>
          
          <div>
            <div class="text-h6">{{ device.name }}</div>
            <div class="text-subtitle-2">{{ device.model }}</div>
          </div>
          
          <v-spacer></v-spacer>
          
          <v-btn
            icon="mdi-cog"
            variant="text"
            @click="showSettings = true"
          ></v-btn>
        </div>
      </v-card-item>

      <!-- Quick Stats -->
      <v-card-text>
        <v-row dense>
          <v-col cols="4">
            <div class="text-center">
              <div class="text-h6">{{ formatTemperature(currentTemp) }}</div>
              <div class="text-caption">Current</div>
            </div>
          </v-col>
          
          <v-col cols="4">
            <div class="text-center">
              <div class="text-h6">{{ formatTemperature(targetTemp) }}</div>
              <div class="text-caption">Target</div>
            </div>
          </v-col>
          
          <v-col cols="4">
            <div class="text-center">
              <div class="text-h6">{{ mode }}</div>
              <div class="text-caption">Mode</div>
            </div>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Status Cards -->
    <v-row dense class="mb-4">
      <!-- System Status -->
      <v-col cols="6">
        <v-card>
          <v-card-text class="text-center">
            <v-icon
              :icon="getStatusIcon(device)"
              :color="getStatusColor(device)"
              size="32"
              class="mb-2"
            ></v-icon>
            <div class="text-h6">{{ getStatusText(device) }}</div>
            <div class="text-caption">System Status</div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Performance -->
      <v-col cols="6">
        <v-card>
          <v-card-text class="text-center">
            <v-icon
              icon="mdi-trending-up"
              :color="getPerformanceColor(performanceScore)"
              size="32"
              class="mb-2"
            ></v-icon>
            <div class="text-h6">{{ performanceScore }}%</div>
            <div class="text-caption">Performance</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Charts -->
    <v-expansion-panels class="mb-4">
      <v-expansion-panel title="Temperature History">
        <template v-slot:text>
          <v-sheet
            class="pa-4"
            min-height="300"
          >
            <v-chart
              :option="temperatureChartOption"
              autoresize
            />
          </v-sheet>
        </template>
      </v-expansion-panel>

      <v-expansion-panel title="Energy Usage">
        <template v-slot:text>
          <v-sheet
            class="pa-4"
            min-height="300"
          >
            <v-chart
              :option="energyChartOption"
              autoresize
            />
          </v-sheet>
        </template>
      </v-expansion-panel>
    </v-expansion-panels>

    <!-- Quick Actions -->
    <v-card>
      <v-list>
        <v-list-subheader>Quick Actions</v-list-subheader>
        
        <!-- Mode Selection -->
        <v-list-item>
          <template v-slot:prepend>
            <v-icon icon="mdi-thermostat"></v-icon>
          </template>
          
          <v-list-item-title>Operation Mode</v-list-item-title>
          
          <template v-slot:append>
            <v-select
              v-model="selectedMode"
              :items="availableModes"
              density="compact"
              hide-details
              class="max-width-120"
              @update:model-value="updateMode"
            ></v-select>
          </template>
        </v-list-item>

        <!-- Temperature Control -->
        <v-list-item>
          <template v-slot:prepend>
            <v-icon icon="mdi-thermometer"></v-icon>
          </template>
          
          <v-list-item-title>Temperature</v-list-item-title>
          
          <template v-slot:append>
            <div class="d-flex align-center">
              <v-btn
                icon="mdi-minus"
                variant="text"
                size="small"
                @click="decreaseTemp"
                :disabled="!canDecreaseTemp"
              ></v-btn>
              
              <span class="mx-2">{{ formatTemperature(targetTemp) }}</span>
              
              <v-btn
                icon="mdi-plus"
                variant="text"
                size="small"
                @click="increaseTemp"
                :disabled="!canIncreaseTemp"
              ></v-btn>
            </div>
          </template>
        </v-list-item>

        <!-- Power Control -->
        <v-list-item>
          <template v-slot:prepend>
            <v-icon icon="mdi-power"></v-icon>
          </template>
          
          <v-list-item-title>Power</v-list-item-title>
          
          <template v-slot:append>
            <v-switch
              v-model="powerOn"
              color="success"
              hide-details
              @update:model-value="togglePower"
            ></v-switch>
          </template>
        </v-list-item>
      </v-list>
    </v-card>

    <!-- Settings Dialog -->
    <v-dialog
      v-model="showSettings"
      fullscreen
      transition="dialog-bottom-transition"
    >
      <v-card>
        <v-toolbar
          color="primary"
          prominent
        >
          <v-btn
            icon="mdi-close"
            @click="showSettings = false"
          ></v-btn>
          <v-toolbar-title>Device Settings</v-toolbar-title>
        </v-toolbar>

        <v-card-text>
          <device-settings
            :device="device"
            @update="refreshDevice"
          />
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import type { DaikinDeviceInfo } from '@/api/daikin/types'
import { useDaikinStore } from '@/store/daikinStore'
import DeviceSettings from './DeviceSettings.vue'

// Initialize ECharts
use([
  CanvasRenderer,
  LineChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
])

const props = defineProps<{
  device: DaikinDeviceInfo
}>()

// Store
const daikinStore = useDaikinStore()

// State
const showSettings = ref(false)
const selectedMode = ref(props.device.mode)
const powerOn = ref(props.device.powerOn)
const currentTemp = ref(props.device.currentTemp)
const targetTemp = ref(props.device.targetTemp)
const mode = ref(props.device.mode)
const performanceScore = ref(85) // Example value

// Computed
const availableModes = computed(() => [
  { title: 'Auto', value: 'auto' },
  { title: 'Heat', value: 'heat' },
  { title: 'Cool', value: 'cool' },
  { title: 'Fan', value: 'fan' }
])

const canIncreaseTemp = computed(() => 
  targetTemp.value < props.device.maxTemp
)

const canDecreaseTemp = computed(() => 
  targetTemp.value > props.device.minTemp
)

const temperatureChartOption = computed(() => ({
  // Chart configuration for temperature history
}))

const energyChartOption = computed(() => ({
  // Chart configuration for energy usage
}))

// Methods
const getDeviceTypeIcon = (type: string) => {
  switch (type) {
    case 'altherma': return 'mdi-hvac'
    default: return 'mdi-air-conditioner'
  }
}

const getDeviceStatusColor = (device: DaikinDeviceInfo) => {
  if (!device.connected) return 'error'
  return powerOn.value ? 'success' : 'grey'
}

const getStatusIcon = (device: DaikinDeviceInfo) => {
  if (!device.connected) return 'mdi-power-plug-off'
  return powerOn.value ? 'mdi-power-plug' : 'mdi-power-plug-off'
}

const getStatusColor = (device: DaikinDeviceInfo) => {
  if (!device.connected) return 'error'
  return powerOn.value ? 'success' : 'grey'
}

const getStatusText = (device: DaikinDeviceInfo) => {
  if (!device.connected) return 'Disconnected'
  return powerOn.value ? 'Running' : 'Standby'
}

const getPerformanceColor = (score: number) => {
  if (score >= 80) return 'success'
  if (score >= 60) return 'warning'
  return 'error'
}

const formatTemperature = (temp: number) => {
  return `${temp.toFixed(1)}°C`
}

const togglePower = async () => {
  try {
    await daikinStore.updateDevicePower(props.device.id, powerOn.value)
  } catch (error) {
    // Handle error
    powerOn.value = !powerOn.value
  }
}

const updateMode = async () => {
  try {
    await daikinStore.updateDeviceMode(props.device.id, selectedMode.value)
    mode.value = selectedMode.value
  } catch (error) {
    // Handle error
    selectedMode.value = mode.value
  }
}

const increaseTemp = async () => {
  if (!canIncreaseTemp.value) return
  try {
    const newTemp = targetTemp.value + 0.5
    await daikinStore.updateDeviceTemperature(props.device.id, newTemp)
    targetTemp.value = newTemp
  } catch (error) {
    // Handle error
  }
}

const decreaseTemp = async () => {
  if (!canDecreaseTemp.value) return
  try {
    const newTemp = targetTemp.value - 0.5
    await daikinStore.updateDeviceTemperature(props.device.id, newTemp)
    targetTemp.value = newTemp
  } catch (error) {
    // Handle error
  }
}

const refreshDevice = async () => {
  await daikinStore.refreshDeviceInfo(props.device.id)
}
</script>

<style scoped>
.device-details-mobile {
  max-width: 100%;
  overflow-x: hidden;
}

.max-width-120 {
  max-width: 120px;
}

/* Chart responsiveness */
.v-chart {
  width: 100%;
  height: 300px;
}

@media (max-width: 600px) {
  .v-chart {
    height: 250px;
  }
}

/* Touch optimizations */
@media (pointer: coarse) {
  .v-list-item {
    min-height: 56px;
  }

  .v-btn {
    min-height: 44px;
  }
}
</style>