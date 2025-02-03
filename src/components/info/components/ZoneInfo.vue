/**
 * Zone information display component
 */
<template>
  <v-card flat>
    <v-card-title class="text-subtitle-1">
      Zone Configuration
    </v-card-title>

    <v-card-text>
      <v-row dense>
        <v-col
          v-for="zone in zones"
          :key="zone.id"
          cols="12"
          sm="6"
        >
          <v-card
            :color="getZoneColor(zone)"
            variant="outlined"
          >
            <v-card-text>
              <!-- Zone Header -->
              <div class="d-flex align-center mb-2">
                <v-icon
                  :icon="getZoneIcon(zone)"
                  size="small"
                  class="mr-2"
                ></v-icon>
                <span class="font-weight-medium">{{ zone.name }}</span>
                <v-chip
                  :color="getStatusColor(zone.status)"
                  size="x-small"
                  class="ml-2"
                >
                  {{ formatStatus(zone.status) }}
                </v-chip>
              </div>

              <!-- Zone Details -->
              <div class="d-flex flex-column gap-1">
                <!-- Type -->
                <div class="d-flex align-center">
                  <v-icon
                    icon="mdi-radiator"
                    size="small"
                    class="mr-2"
                  ></v-icon>
                  <span class="text-caption">{{ zone.type }}</span>
                </div>

                <!-- Temperature -->
                <div class="d-flex align-center justify-space-between">
                  <div class="d-flex align-center">
                    <v-icon
                      icon="mdi-thermometer"
                      size="small"
                      class="mr-2"
                    ></v-icon>
                    <span class="text-caption">Current</span>
                  </div>
                  <span class="font-weight-medium">
                    {{ formatTemperature(zone.temperature) }}
                  </span>
                </div>

                <!-- Target Temperature -->
                <div class="d-flex align-center justify-space-between">
                  <div class="d-flex align-center">
                    <v-icon
                      icon="mdi-target"
                      size="small"
                      class="mr-2"
                    ></v-icon>
                    <span class="text-caption">Target</span>
                  </div>
                  <span class="font-weight-medium">
                    {{ formatTemperature(zone.targetTemperature) }}
                  </span>
                </div>

                <!-- Humidity (if available) -->
                <div
                  v-if="zone.humidity !== undefined"
                  class="d-flex align-center justify-space-between"
                >
                  <div class="d-flex align-center">
                    <v-icon
                      icon="mdi-water-percent"
                      size="small"
                      class="mr-2"
                    ></v-icon>
                    <span class="text-caption">Humidity</span>
                  </div>
                  <span class="font-weight-medium">
                    {{ formatHumidity(zone.humidity) }}
                  </span>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import type { ZoneInfo } from '../types'

const props = defineProps<{
  zones: ZoneInfo[]
}>()

// Methods
const getZoneIcon = (zone: ZoneInfo) => {
  switch (zone.type.toLowerCase()) {
    case 'underfloor': return 'mdi-floor-plan'
    case 'radiator': return 'mdi-radiator'
    case 'fancoil': return 'mdi-fan'
    default: return 'mdi-thermostat'
  }
}

const getZoneColor = (zone: ZoneInfo) => {
  if (zone.status === 'disabled') return 'grey-lighten-3'
  return undefined
}

const getStatusColor = (status: ZoneInfo['status']) => {
  switch (status) {
    case 'active': return 'success'
    case 'idle': return 'warning'
    case 'disabled': return 'error'
    default: return 'grey'
  }
}

const formatStatus = (status: ZoneInfo['status']) => {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

const formatTemperature = (temp: number) => {
  return `${temp.toFixed(1)}°C`
}

const formatHumidity = (humidity: number) => {
  return `${humidity.toFixed(0)}%`
}
</script>