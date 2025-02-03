/**
 * Mobile-optimized optimization panel component
 */
<template>
  <div class="optimization-panel-mobile">
    <!-- Optimization Scores -->
    <v-sheet class="score-container mb-4" rounded>
      <v-row dense>
        <v-col
          v-for="score in scores"
          :key="score.id"
          cols="4"
        >
          <v-card
            :color="getScoreColor(score.value)"
            class="score-card"
            theme="dark"
          >
            <v-card-text class="text-center pa-2">
              <div class="text-h4 font-weight-bold">
                {{ score.value }}%
              </div>
              <div class="text-caption text-truncate">
                {{ score.label }}
              </div>
              <v-icon
                v-if="score.trend"
                :icon="getTrendIcon(score.trend)"
                size="small"
                class="mt-1"
              ></v-icon>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-sheet>

    <!-- Optimization Suggestions -->
    <div class="suggestions-container">
      <v-expansion-panels>
        <v-expansion-panel
          v-for="suggestion in suggestions"
          :key="suggestion.id"
          :value="suggestion.id"
          :title="suggestion.title"
          :text="suggestion.description"
        >
          <template v-slot:title>
            <div class="d-flex align-center">
              <v-icon
                :icon="getPriorityIcon(suggestion.priority)"
                :color="getPriorityColor(suggestion.priority)"
                size="small"
                class="mr-2"
              ></v-icon>
              <span>{{ suggestion.title }}</span>
            </div>
          </template>

          <v-expansion-panel-text>
            <!-- Impact Cards -->
            <v-row dense class="mb-4">
              <v-col
                v-for="(impact, key) in suggestion.impact"
                :key="key"
                cols="4"
              >
                <v-card variant="outlined">
                  <v-card-text class="text-center pa-2">
                    <div
                      class="text-h6"
                      :class="getImpactClass(impact)"
                    >
                      {{ formatImpact(impact) }}
                    </div>
                    <div class="text-caption">
                      {{ formatImpactLabel(key) }}
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>

            <!-- Settings Changes -->
            <v-list density="compact">
              <v-list-subheader>Affected Settings</v-list-subheader>
              
              <v-list-item
                v-for="setting in getAffectedSettings(suggestion)"
                :key="setting.code"
              >
                <template v-slot:prepend>
                  <v-icon
                    icon="mdi-arrow-right"
                    size="small"
                  ></v-icon>
                </template>

                <v-list-item-title>
                  {{ setting.name }}
                </v-list-item-title>

                <template v-slot:append>
                  <div class="d-flex align-center">
                    <span class="text-caption text-medium-emphasis mr-2">
                      {{ setting.currentValue }}
                    </span>
                    <v-icon
                      icon="mdi-arrow-right"
                      size="x-small"
                      color="primary"
                      class="mx-1"
                    ></v-icon>
                    <span
                      class="text-caption"
                      :class="getChangeClass(setting)"
                    >
                      {{ setting.suggestedValue }}
                    </span>
                  </div>
                </template>
              </v-list-item>
            </v-list>

            <!-- Actions -->
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn
                color="primary"
                :loading="applying === suggestion.id"
                :disabled="!suggestion.canAutoApply"
                @click="applyOptimization(suggestion)"
              >
                Apply Changes
              </v-btn>
            </v-card-actions>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </div>

    <!-- Performance Charts -->
    <v-expansion-panels class="mt-4">
      <v-expansion-panel title="Performance Analysis">
        <template v-slot:text>
          <v-card-text class="pa-0">
            <v-tabs v-model="activeChart">
              <v-tab value="energy">Energy</v-tab>
              <v-tab value="comfort">Comfort</v-tab>
              <v-tab value="cost">Cost</v-tab>
            </v-tabs>

            <v-window v-model="activeChart">
              <v-window-item value="energy">
                <v-sheet
                  class="pa-4"
                  min-height="300"
                >
                  <v-chart
                    :option="energyChartOption"
                    autoresize
                  />
                </v-sheet>
              </v-window-item>

              <v-window-item value="comfort">
                <v-sheet
                  class="pa-4"
                  min-height="300"
                >
                  <v-chart
                    :option="comfortChartOption"
                    autoresize
                  />
                </v-sheet>
              </v-window-item>

              <v-window-item value="cost">
                <v-sheet
                  class="pa-4"
                  min-height="300"
                >
                  <v-chart
                    :option="costChartOption"
                    autoresize
                  />
                </v-sheet>
              </v-window-item>
            </v-window>
          </v-card-text>
        </template>
      </v-expansion-panel>
    </v-expansion-panels>
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
import type { OptimizationSuggestion } from '@/types'
import { useSettingsStore } from '@/store/settingsStore'

// Initialize ECharts
use([
  CanvasRenderer,
  LineChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
])

// Props & Emits
const props = defineProps<{
  scores: Array<{
    id: string
    label: string
    value: number
    trend?: 'up' | 'down' | 'stable'
  }>
  suggestions: OptimizationSuggestion[]
}>()

const emit = defineEmits<{
  optimize: []
}>()

// Store
const settingsStore = useSettingsStore()

// State
const activeChart = ref('energy')
const applying = ref<string | null>(null)

// Chart Options
const energyChartOption = computed(() => ({
  // Chart configuration
}))

const comfortChartOption = computed(() => ({
  // Chart configuration
}))

const costChartOption = computed(() => ({
  // Chart configuration
}))

// Methods
const getScoreColor = (value: number) => {
  if (value >= 80) return 'success'
  if (value >= 60) return 'warning'
  return 'error'
}

const getTrendIcon = (trend: string) => {
  switch (trend) {
    case 'up': return 'mdi-trending-up'
    case 'down': return 'mdi-trending-down'
    default: return 'mdi-trending-neutral'
  }
}

const getPriorityIcon = (priority: string) => {
  switch (priority) {
    case 'high': return 'mdi-alert-circle'
    case 'medium': return 'mdi-alert'
    case 'low': return 'mdi-information'
    default: return 'mdi-help-circle'
  }
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high': return 'error'
    case 'medium': return 'warning'
    case 'low': return 'success'
    default: return 'grey'
  }
}

const getImpactClass = (impact: number) => {
  if (impact > 0) return 'text-success'
  if (impact < 0) return 'text-error'
  return 'text-grey'
}

const formatImpact = (value: number) => {
  const sign = value > 0 ? '+' : ''
  return `${sign}${value}%`
}

const formatImpactLabel = (key: string) => {
  return key.charAt(0).toUpperCase() + key.slice(1)
}

const getAffectedSettings = (suggestion: OptimizationSuggestion) => {
  return suggestion.affectedSettings.map(code => ({
    code,
    name: settingsStore.getSettingByCode(code)?.name || code,
    currentValue: settingsStore.currentSettings[code],
    suggestedValue: suggestion.suggestedValues[code]
  }))
}

const getChangeClass = (setting: { currentValue: string, suggestedValue: string }) => {
  const current = parseFloat(setting.currentValue)
  const suggested = parseFloat(setting.suggestedValue)
  if (suggested > current) return 'text-success'
  if (suggested < current) return 'text-error'
  return 'text-grey'
}

const applyOptimization = async (suggestion: OptimizationSuggestion) => {
  applying.value = suggestion.id
  try {
    await settingsStore.applyOptimization(suggestion)
  } finally {
    applying.value = null
  }
}
</script>

<style scoped>
.optimization-panel-mobile {
  max-width: 100%;
  overflow-x: hidden;
}

.score-container {
  padding: var(--spacing-md);
  background-color: var(--v-theme-surface);
}

.score-card {
  min-height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Touch optimizations */
@media (pointer: coarse) {
  .v-expansion-panel-title {
    min-height: 56px;
  }

  .v-btn {
    min-height: 44px;
  }
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
</style>