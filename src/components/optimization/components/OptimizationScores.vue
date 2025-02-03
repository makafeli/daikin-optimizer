/**
 * Optimization scores display component
 */
<template>
  <v-card flat class="mb-4">
    <v-card-text>
      <v-row dense>
        <v-col
          v-for="score in scores"
          :key="score.label"
          cols="12"
          sm="4"
        >
          <v-card
            :color="score.color"
            theme="dark"
            class="score-card"
          >
            <v-card-text>
              <div class="d-flex align-center mb-2">
                <v-icon
                  :icon="score.icon"
                  size="20"
                  class="mr-2"
                ></v-icon>
                <span class="text-caption">{{ score.label }}</span>
              </div>

              <div class="d-flex align-center">
                <v-progress-circular
                  :model-value="score.value"
                  :color="getScoreColor(score.value)"
                  size="64"
                  width="7"
                >
                  {{ score.value }}%
                </v-progress-circular>

                <div class="ml-4">
                  <div class="d-flex align-center">
                    <v-icon
                      v-if="score.trend"
                      :icon="getTrendIcon(score.trend)"
                      size="small"
                      class="mr-1"
                    ></v-icon>
                    <span
                      v-if="score.change"
                      class="text-caption"
                    >
                      {{ formatChange(score.change) }}
                    </span>
                  </div>
                  <div class="text-caption mt-1">
                    {{ score.description }}
                  </div>
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
import type { OptimizationScore } from '../types'

const props = defineProps<{
  scores: OptimizationScore[]
}>()

// Methods
const getScoreColor = (value: number) => {
  if (value >= 80) return 'success'
  if (value >= 60) return 'warning'
  return 'error'
}

const getTrendIcon = (trend: OptimizationScore['trend']) => {
  switch (trend) {
    case 'up': return 'mdi-trending-up'
    case 'down': return 'mdi-trending-down'
    default: return 'mdi-trending-neutral'
  }
}

const formatChange = (change: number) => {
  const sign = change > 0 ? '+' : ''
  return `${sign}${change.toFixed(1)}%`
}
</script>

<style scoped>
.score-card {
  height: 100%;
  transition: transform 0.2s;
}

.score-card:hover {
  transform: translateY(-2px);
}
</style>