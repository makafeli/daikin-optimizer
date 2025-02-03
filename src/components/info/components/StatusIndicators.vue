/**
 * Status indicators display component
 */
<template>
  <v-card flat>
    <v-card-title class="text-subtitle-1">
      Current Status
      <v-spacer></v-spacer>
      <v-btn
        icon="mdi-refresh"
        variant="text"
        size="small"
        :loading="loading"
        @click="$emit('refresh')"
      ></v-btn>
    </v-card-title>

    <v-card-text>
      <v-row dense>
        <v-col
          v-for="indicator in indicators"
          :key="indicator.id"
          cols="6"
          sm="4"
        >
          <v-badge
            :color="getStatusColor(indicator.status)"
            dot
            location="bottom end"
          >
            <v-card variant="tonal">
              <v-card-text class="text-center">
                <v-icon
                  :icon="indicator.icon"
                  size="large"
                  :color="getStatusColor(indicator.status)"
                  class="mb-2"
                ></v-icon>
                <div class="text-caption text-medium-emphasis">
                  {{ indicator.label }}
                </div>
                <div class="text-subtitle-2 font-weight-medium">
                  {{ formatValue(indicator) }}
                </div>
              </v-card-text>
            </v-card>
          </v-badge>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import type { StatusIndicator } from '../types'

const props = defineProps<{
  indicators: StatusIndicator[]
  loading?: boolean
}>()

defineEmits<{
  refresh: []
}>()

// Methods
const getStatusColor = (status: StatusIndicator['status']) => {
  switch (status) {
    case 'normal': return 'success'
    case 'warning': return 'warning'
    case 'error': return 'error'
    case 'inactive': return 'grey'
    default: return undefined
  }
}

const formatValue = (indicator: StatusIndicator) => {
  if (typeof indicator.value === 'number') {
    const value = indicator.value.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    })
    return indicator.unit ? `${value} ${indicator.unit}` : value
  }
  return indicator.value
}
</script>