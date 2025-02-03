/**
 * Mobile-optimized device management view
 */
<template>
  <div class="device-manager-mobile">
    <!-- Connection Status -->
    <v-alert
      :type="connectionStatus.type"
      :icon="connectionStatus.icon"
      class="mb-4"
      variant="tonal"
      density="comfortable"
    >
      {{ connectionStatus.message }}
    </v-alert>

    <!-- Device List -->
    <div class="device-list">
      <v-row dense>
        <!-- Device Cards -->
        <v-col
          v-for="device in devices"
          :key="device.id"
          cols="12"
        >
          <v-card
            :class="{
              'selected-device': device.id === selectedDeviceId
            }"
            @click="selectDevice(device.id)"
          >
            <v-card-item>
              <!-- Device Header -->
              <div class="d-flex align-center mb-2">
                <v-icon
                  :icon="getDeviceTypeIcon(device.deviceType)"
                  :color="getDeviceStatusColor(device)"
                  size="large"
                  class="mr-4"
                ></v-icon>
                <div>
                  <div class="text-h6">{{ device.name }}</div>
                  <div class="text-subtitle-2">{{ device.model }}</div>
                </div>
                <v-spacer></v-spacer>
                <v-btn
                  icon="mdi-dots-vertical"
                  variant="text"
                  @click.stop="showDeviceMenu(device)"
                ></v-btn>
              </div>

              <!-- Device Info -->
              <v-list density="compact">
                <!-- Status -->
                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon
                      :icon="getStatusIcon(device)"
                      :color="getStatusColor(device)"
                      size="small"
                    ></v-icon>
                  </template>
                  <v-list-item-title>
                    {{ getStatusText(device) }}
                  </v-list-item-title>
                </v-list-item>

                <!-- Serial Number -->
                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon icon="mdi-barcode" size="small"></v-icon>
                  </template>
                  <v-list-item-title class="text-body-2">
                    Serial: {{ device.serialNumber }}
                  </v-list-item-title>
                </v-list-item>

                <!-- Firmware -->
                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon icon="mdi-chip" size="small"></v-icon>
                  </template>
                  <v-list-item-title class="text-body-2">
                    Firmware: {{ device.firmwareVersion }}
                  </v-list-item-title>
                </v-list-item>

                <!-- Last Connected -->
                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon icon="mdi-clock-outline" size="small"></v-icon>
                  </template>
                  <v-list-item-title class="text-body-2">
                    Last seen: {{ formatLastSeen(device.lastSeen) }}
                  </v-list-item-title>
                </v-list-item>
              </v-list>

              <!-- Quick Actions -->
              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn
                  :color="device.id === selectedDeviceId ? 'primary' : undefined"
                  :variant="device.id === selectedDeviceId ? 'tonal' : 'text'"
                  :prepend-icon="device.id === selectedDeviceId ? 'mdi-check' : 'mdi-tune'"
                  @click.stop="selectDevice(device.id)"
                >
                  {{ device.id === selectedDeviceId ? 'Selected' : 'Select' }}
                </v-btn>
                <v-btn
                  variant="text"
                  prepend-icon="mdi-refresh"
                  @click.stop="refreshDevice(device.id)"
                  :loading="refreshing === device.id"
                >
                  Refresh
                </v-btn>
              </v-card-actions>
            </v-card-item>
          </v-card>
        </v-col>

        <!-- Add Device Card -->
        <v-col cols="12">
          <v-card
            class="add-device-card"
            @click="showSetupDialog"
          >
            <v-card-item>
              <div class="d-flex align-center justify-center" style="height: 100px">
                <div class="text-center">
                  <v-icon
                    icon="mdi-plus-circle-outline"
                    size="48"
                    color="primary"
                  ></v-icon>
                  <div class="text-h6 mt-2">Add Device</div>
                  <div class="text-caption text-medium-emphasis">
                    Configure a new Daikin device
                  </div>
                </div>
              </div>
            </v-card-item>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- Device Menu -->
    <v-menu
      v-model="showMenu"
      :position-x="menuX"
      :position-y="menuY"
      absolute
      offset-y
    >
      <v-list>
        <v-list-item
          v-for="action in deviceActions"
          :key="action.key"
          :value="action.key"
          :prepend-icon="action.icon"
          @click="handleDeviceAction(action.key)"
        >
          <v-list-item-title>{{ action.label }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>

    <!-- Setup Dialog -->
    <v-dialog
      v-model="showSetup"
      max-width="600"
    >
      <daikin-setup @close="showSetup = false" />
    </v-dialog>

    <!-- Device Settings Dialog -->
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
            v-if="selectedDevice"
            :device="selectedDevice"
          />
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { formatDistanceToNow } from 'date-fns'
import type { DaikinDeviceInfo } from '@/api/daikin/types'
import { useDaikinStore } from '@/store/daikinStore'
import DaikinSetup from '../setup/DaikinSetup.vue'
import DeviceSettings from './DeviceSettings.vue'

// Store
const daikinStore = useDaikinStore()

// State
const showSetup = ref(false)
const showSettings = ref(false)
const showMenu = ref(false)
const menuX = ref(0)
const menuY = ref(0)
const selectedMenuDevice = ref<DaikinDeviceInfo | null>(null)
const refreshing = ref<string | null>(null)

// Computed
const devices = computed(() => daikinStore.devices)
const selectedDeviceId = computed(() => daikinStore.selectedDeviceId)
const selectedDevice = computed(() => daikinStore.selectedDevice)

const connectionStatus = computed(() => {
  const isConnected = daikinStore.isConnected
  const deviceCount = devices.value.length

  if (!isConnected) {
    return {
      type: 'error',
      icon: 'mdi-cloud-off-outline',
      message: 'Not connected to Daikin cloud'
    }
  }

  if (deviceCount === 0) {
    return {
      type: 'info',
      icon: 'mdi-information',
      message: 'No devices found. Add your first device to get started.'
    }
  }

  return {
    type: 'success',
    icon: 'mdi-cloud-check',
    message: `Connected to ${deviceCount} device${deviceCount === 1 ? '' : 's'}`
  }
})

const deviceActions = [
  {
    key: 'settings',
    label: 'Settings',
    icon: 'mdi-cog'
  },
  {
    key: 'rename',
    label: 'Rename',
    icon: 'mdi-pencil'
  },
  {
    key: 'remove',
    label: 'Remove Device',
    icon: 'mdi-delete',
    color: 'error'
  }
]

// Methods
const getDeviceTypeIcon = (type: string) => {
  switch (type) {
    case 'altherma': return 'mdi-hvac'
    default: return 'mdi-air-conditioner'
  }
}

const getDeviceStatusColor = (device: DaikinDeviceInfo) => {
  if (!device.connected) return 'error'
  return 'success'
}

const getStatusIcon = (device: DaikinDeviceInfo) => {
  if (!device.connected) return 'mdi-power-plug-off'
  return 'mdi-power-plug'
}

const getStatusColor = (device: DaikinDeviceInfo) => {
  if (!device.connected) return 'error'
  return 'success'
}

const getStatusText = (device: DaikinDeviceInfo) => {
  if (!device.connected) return 'Disconnected'
  return 'Connected'
}

const formatLastSeen = (timestamp: number) => {
  return formatDistanceToNow(timestamp, { addSuffix: true })
}

const selectDevice = (deviceId: string) => {
  daikinStore.selectDevice(deviceId)
}

const refreshDevice = async (deviceId: string) => {
  refreshing.value = deviceId
  try {
    await daikinStore.refreshDeviceInfo(deviceId)
  } finally {
    refreshing.value = null
  }
}

const showDeviceMenu = (device: DaikinDeviceInfo, event: MouseEvent) => {
  selectedMenuDevice.value = device
  menuX.value = event.clientX
  menuY.value = event.clientY
  showMenu.value = true
}

const handleDeviceAction = async (action: string) => {
  const device = selectedMenuDevice.value
  if (!device) return

  showMenu.value = false

  switch (action) {
    case 'settings':
      showSettings.value = true
      break
    case 'rename':
      // Show rename dialog
      break
    case 'remove':
      // Show confirm dialog
      break
  }
}

const showSetupDialog = () => {
  showSetup.value = true
}
</script>

<style scoped>
.device-manager-mobile {
  max-width: 100%;
  overflow-x: hidden;
}

.selected-device {
  border: 2px solid rgb(var(--v-theme-primary));
}

.add-device-card {
  border: 2px dashed rgba(var(--v-theme-on-surface), 0.1);
  transition: all 0.3s ease;
}

.add-device-card:hover {
  border-color: rgba(var(--v-theme-primary), 0.5);
  background-color: rgba(var(--v-theme-primary), 0.05);
}

/* Touch optimizations */
@media (pointer: coarse) {
  .v-card-actions .v-btn {
    min-height: 44px;
  }

  .v-list-item {
    min-height: 48px;
  }
}
</style>