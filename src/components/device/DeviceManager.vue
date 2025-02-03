/**
 * Device discovery and management component
 */
<template>
  <div>
    <!-- Connection Status -->
    <v-alert
      :type="connectionAlert.type"
      :icon="connectionAlert.icon"
      class="mb-4"
    >
      {{ connectionAlert.message }}
    </v-alert>

    <!-- Device List -->
    <v-container v-if="isConnected" class="px-0">
      <v-row>
        <!-- Device Cards -->
        <v-col
          v-for="device in devices"
          :key="device.id"
          cols="12"
          sm="6"
          md="4"
        >
          <v-card
            :class="{
              'border-primary': device.id === selectedDeviceId
            }"
            @click="selectDevice(device.id)"
          >
            <v-card-item>
              <template v-slot:prepend>
                <v-icon
                  :icon="getDeviceIcon(device)"
                  size="large"
                  :color="getDeviceColor(device)"
                ></v-icon>
              </template>
              <v-card-title>{{ device.name }}</v-card-title>
              <v-card-subtitle>{{ device.model }}</v-card-subtitle>
            </v-card-item>

            <v-card-text>
              <v-list density="compact">
                <!-- Serial Number -->
                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon icon="mdi-barcode" size="small"></v-icon>
                  </template>
                  <v-list-item-title class="text-caption">
                    Serial: {{ device.serialNumber }}
                  </v-list-item-title>
                </v-list-item>

                <!-- Firmware -->
                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon icon="mdi-chip" size="small"></v-icon>
                  </template>
                  <v-list-item-title class="text-caption">
                    Firmware: {{ device.firmwareVersion }}
                  </v-list-item-title>
                </v-list-item>

                <!-- MAC Address -->
                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon icon="mdi-ethernet" size="small"></v-icon>
                  </template>
                  <v-list-item-title class="text-caption">
                    MAC: {{ formatMac(device.macAddress) }}
                  </v-list-item-title>
                </v-list-item>
              </v-list>
            </v-card-text>

            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn
                variant="text"
                :color="device.id === selectedDeviceId ? 'primary' : undefined"
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
          </v-card>
        </v-col>

        <!-- Add Device Card -->
        <v-col cols="12" sm="6" md="4">
          <v-card
            class="d-flex align-center justify-center"
            height="100%"
            style="min-height: 200px"
            @click="startDeviceSetup"
          >
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
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- Setup Dialog -->
    <v-dialog v-model="showSetup" max-width="600px">
      <daikin-setup @close="showSetup = false" />
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDaikinStore } from '@/store/daikinStore'
import type { DaikinDeviceInfo } from '@/api/daikin/types'
import DaikinSetup from '../setup/DaikinSetup.vue'

// Store
const daikinStore = useDaikinStore()

// State
const showSetup = ref(false)
const refreshing = ref<string | null>(null)

// Computed
const isConnected = computed(() => daikinStore.isConnected)
const devices = computed(() => daikinStore.devices)
const selectedDeviceId = computed(() => daikinStore.selectedDeviceId)

const connectionAlert = computed(() => {
  if (!isConnected.value) {
    return {
      type: 'error',
      icon: 'mdi-cloud-off-outline',
      message: 'Not connected to Daikin cloud'
    }
  }

  if (devices.value.length === 0) {
    return {
      type: 'info',
      icon: 'mdi-information',
      message: 'No devices found. Click "Add Device" to set up a new device.'
    }
  }

  return {
    type: 'success',
    icon: 'mdi-cloud-check',
    message: `Connected to ${devices.value.length} device(s)`
  }
})

// Methods
const getDeviceIcon = (device: DaikinDeviceInfo) => {
  switch (device.deviceType) {
    case 'altherma': return 'mdi-hvac'
    default: return 'mdi-air-conditioner'
  }
}

const getDeviceColor = (device: DaikinDeviceInfo) => {
  return device.id === selectedDeviceId.value ? 'primary' : undefined
}

const formatMac = (mac: string) => {
  return mac.match(/.{2}/g)?.join(':') || mac
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

const startDeviceSetup = () => {
  showSetup.value = true
}
</script>

<style scoped>
.border-primary {
  border: 2px solid rgb(var(--v-theme-primary));
}
</style>