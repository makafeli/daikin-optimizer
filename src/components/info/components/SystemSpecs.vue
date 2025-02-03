/**
 * System specifications display component
 */
<template>
  <v-card flat>
    <v-card-title class="text-subtitle-1">
      System Specifications
    </v-card-title>

    <v-card-text>
      <v-list density="compact">
        <v-list-item
          v-for="spec in specifications"
          :key="spec.id"
          :title="spec.label"
        >
          <template v-slot:prepend>
            <v-icon
              :icon="spec.icon"
              :color="spec.color"
              size="small"
            ></v-icon>
          </template>
          <template v-slot:append>
            <span class="font-weight-medium">
              {{ formatValue(spec) }}
            </span>
          </template>
        </v-list-item>
      </v-list>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import type { SystemSpecification } from '../types'

const props = defineProps<{
  specifications: SystemSpecification[]
}>()

// Methods
const formatValue = (spec: SystemSpecification) => {
  if (typeof spec.value === 'number') {
    const value = spec.value.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    })
    return spec.unit ? `${value} ${spec.unit}` : value
  }
  return spec.value
}