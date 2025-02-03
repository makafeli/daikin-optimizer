/**
 * Optimization suggestions display component
 */
<template>
  <v-card flat>
    <v-expansion-panels v-model="expandedPanel">
      <v-expansion-panel
        v-for="suggestion in suggestions"
        :key="suggestion.id"
        :value="suggestion.id"
      >
        <v-expansion-panel-title>
          <div class="d-flex align-center">
            <v-icon
              :icon="getPriorityIcon(suggestion.priority)"
              :color="getPriorityColor(suggestion.priority)"
              class="mr-2"
              size="small"
            ></v-icon>
            <div>
              <div class="text-subtitle-2">{{ suggestion.title }}</div>
              <div class="text-caption text-medium-emphasis">
                {{ getImpactSummary(suggestion.impact) }}
              </div>
            </div>
          </div>
        </v-expansion-panel-title>

        <v-expansion-panel-text>
          <!-- Description -->
          <div class="text-body-2 mb-4">
            {{ suggestion.description }}
          </div>

          <!-- Impact Details -->
          <v-row dense class="mb-4">
            <v-col
              v-for="(value, key) in suggestion.impact"
              :key="key"
              cols="4"
            >
              <v-card variant="outlined">
                <v-card-text class="text-center">
                  <div class="text-h6" :class="getImpactClass(value)">
                    {{ formatImpact(value) }}
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    {{ formatImpactLabel(key) }}
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>

          <!-- Affected Settings -->
          <v-list density="compact" class="mb-4">
            <v-list-subheader>Affected Settings</v-list-subheader>
            <v-list-item
              v-for="setting in affectedSettings"
              :key="setting.code"
            >
              <template v-slot:prepend>
                <v-icon
                  icon="mdi-arrow-right-bold"
                  size="small"
                  class="mr-2"
                ></v-icon>
              </template>
              <v-list-item-title>{{ setting.setting.name }}</v-list-item-title>
              <template v-slot:append>
                <div class="d-flex align-center">
                  <span class="text-caption text-medium-emphasis mr-2">
                    {{ setting.currentValue }}
                  </span>
                  <v-icon
                    icon="mdi-arrow-right"
                    size="small"
                    class="mx-2"
                  ></v-icon>
                  <span
                    class="text-caption"
                    :class="getValueChangeClass(setting)"
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
              variant="text"
              @click="$emit('dismiss', suggestion.id)"
            >
              Dismiss
            </v-btn>
            <v-btn
              color="primary"
              :disabled="!suggestion.canAutoApply"
              :loading="applying"
              @click="$emit('apply', suggestion)"
            >
              Apply Changes
            </v-btn>
          </v-card-actions>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { OptimizationSuggestion, SettingComparison } from '../types'

const props = defineProps<{
  suggestions: OptimizationSuggestion[]
  applying?: boolean
}>()

const emit = defineEmits<{
  dismiss: [id: string]
  apply: [suggestion: OptimizationSuggestion]
}>()

// State
const expandedPanel = ref<string | null>(null)

// Computed
const affectedSettings = computed<SettingComparison[]>(() => {
  const activeSuggestion = props.suggestions.find(s => s.id === expandedPanel.value)
  if (!activeSuggestion) return []

  return Object.entries(activeSuggestion.suggestedValues).map(([code, value]) => ({
    code,
    setting: activeSuggestion.setting,
    currentValue: activeSuggestion.currentValue,
    suggestedValue: value,
    impact: activeSuggestion.impact
  }))
})

// Methods
const getPriorityIcon = (priority: OptimizationSuggestion['priority']) => {
  switch (priority) {
    case 'high': return 'mdi-alert-circle'
    case 'medium': return 'mdi-alert'
    case 'low': return 'mdi-information'
    default: return 'mdi-help-circle'
  }
}

const getPriorityColor = (priority: OptimizationSuggestion['priority']) => {
  switch (priority) {
    case 'high': return 'error'
    case 'medium': return 'warning'
    case 'low': return 'success'
    default: return 'grey'
  }
}

const getImpactSummary = (impact: OptimizationSuggestion['impact']) => {
  const parts = []
  if (impact.energy) parts.push(`${formatImpact(impact.energy)} energy`)
  if (impact.cost) parts.push(`${formatImpact(impact.cost)} cost`)
  if (impact.comfort) parts.push(`${formatImpact(impact.comfort)} comfort`)
  return parts.join(' • ')
}

const formatImpact = (value: number) => {
  const sign = value > 0 ? '+' : ''
  return `${sign}${value}%`
}

const formatImpactLabel = (key: string) => {
  return key.charAt(0).toUpperCase() + key.slice(1)
}

const getImpactClass = (value: number) => {
  if (value > 0) return 'text-success'
  if (value < 0) return 'text-error'
  return 'text-grey'
}

const getValueChangeClass = (setting: SettingComparison) => {
  const current = parseFloat(setting.currentValue)
  const suggested = parseFloat(setting.suggestedValue)
  if (suggested > current) return 'text-success'
  if (suggested < current) return 'text-error'
  return 'text-grey'
}
</script>