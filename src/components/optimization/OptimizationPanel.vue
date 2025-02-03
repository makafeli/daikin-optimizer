/**
 * Main OptimizationPanel component
 */
<template>
  <v-card>
    <v-card-title class="d-flex align-center">
      Settings Optimization
      <v-spacer></v-spacer>
      <v-btn
        icon="mdi-refresh"
        variant="text"
        :loading="analyzing"
        @click="analyzeSettings"
      ></v-btn>
    </v-card-title>

    <v-card-text>
      <!-- Optimization Scores -->
      <optimization-scores
        :scores="optimizationScores"
      />

      <v-divider class="my-4"></v-divider>

      <!-- Tabs for different sections -->
      <v-tabs v-model="activeTab">
        <v-tab value="suggestions">
          <v-icon start>mdi-lightbulb-outline</v-icon>
          Suggestions
        </v-tab>
        <v-tab value="preferences">
          <v-icon start>mdi-cog-outline</v-icon>
          Preferences
        </v-tab>
        <v-tab value="history">
          <v-icon start>mdi-history</v-icon>
          History
        </v-tab>
      </v-tabs>

      <v-window v-model="activeTab" class="mt-4">
        <!-- Suggestions Tab -->
        <v-window-item value="suggestions">
          <optimization-suggestions
            :suggestions="suggestions"
            :applying="applying"
            @dismiss="dismissSuggestion"
            @apply="applySuggestion"
          />
        </v-window-item>

        <!-- Preferences Tab -->
        <v-window-item value="preferences">
          <optimization-preferences
            v-model:preferences="preferences"
          />
        </v-window-item>

        <!-- History Tab -->
        <v-window-item value="history">
          <v-timeline density="compact" align="start">
            <v-timeline-item
              v-for="item in optimizationHistory"
              :key="item.timestamp"
              :dot-color="getHistoryColor(item)"
              size="small"
            >
              <div class="text-caption">
                {{ formatTimestamp(item.timestamp) }}
              </div>
              <div class="text-body-2">
                {{ formatHistoryChanges(item) }}
              </div>
              <div class="d-flex gap-2 mt-1">
                <v-chip
                  v-for="(value, key) in item.impact"
                  :key="key"
                  :color="getImpactColor(value)"
                  size="x-small"
                  label
                >
                  {{ formatImpact(key, value) }}
                </v-chip>
              </div>
            </v-timeline-item>
          </v-timeline>
        </v-window-item>
      </v-window>
    </v-card-text>

    <!-- Error Alert -->
    <v-alert
      v-if="error"
      type="error"
      class="ma-4"
      density="compact"
      closable
      @click:close="error = null"
    >
      {{ error }}
    </v-alert>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { format } from 'date-fns'
import { useSettingsStore } from '@/store/settingsStore'
import type {
  OptimizationPreferences,
  OptimizationHistory,
  OptimizationScore,
  OptimizationPanelConfig
} from './types'
import type { OptimizationSuggestion } from '@/types'
import OptimizationScores from './components/OptimizationScores.vue'
import OptimizationSuggestions from './components/OptimizationSuggestions.vue'
import OptimizationPreferences from './components/OptimizationPreferences.vue'

// Props
const props = withDefaults(defineProps<{
  config?: Partial<OptimizationPanelConfig>
}>(), {
  config: () => ({
    autoRefresh: true,
    refreshInterval: 300000, // 5 minutes
    showCharts: true,
    showHistory: true,
    enableAutoApply: false
  })
})

// Store
const settingsStore = useSettingsStore()

// State
const analyzing = ref(false)
const applying = ref(false)
const error = ref<string | null>(null)
const activeTab = ref('suggestions')
const refreshTimer = ref<number | null>(null)

const preferences = ref<OptimizationPreferences>({
  prioritizeEfficiency: true,
  prioritizeComfort: false,
  maxTemperatureChange: 2,
  allowAutomaticUpdates: false,
  scheduleOptimization: true
})

// Computed
const optimizationScores = computed<OptimizationScore[]>(() => ([
  {
    value: 85,
    label: 'Overall Efficiency',
    description: 'System running at optimal efficiency',
    icon: 'mdi-lightning-bolt-outline',
    color: 'success',
    trend: 'up',
    change: 5
  },
  {
    value: 78,
    label: 'Comfort Level',
    description: 'Room temperature stability',
    icon: 'mdi-sofa-outline',
    color: 'info',
    trend: 'stable'
  },
  {
    value: 92,
    label: 'Cost Savings',
    description: 'Reduced energy consumption',
    icon: 'mdi-currency-eur',
    color: 'primary',
    trend: 'up',
    change: 8
  }
]))

const suggestions = computed<OptimizationSuggestion[]>(() => 
  settingsStore.optimizationSuggestions
)

const optimizationHistory = computed<OptimizationHistory[]>(() => 
  settingsStore.changeHistory
    .filter(change => change.type === 'optimization')
    .map(change => ({
      timestamp: change.timestamp,
      type: 'automatic',
      changes: [{
        setting: change.code,
        from: change.previousValue,
        to: change.newValue
      }],
      impact: {
        energy: -5,
        comfort: 0,
        cost: -5
      }
    }))
)

// Methods
const analyzeSettings = async () => {
  analyzing.value = true
  error.value = null

  try {
    await settingsStore.analyzeCurrentSettings({
      prioritizeEfficiency: preferences.value.prioritizeEfficiency,
      prioritizeComfort: preferences.value.prioritizeComfort
    })
  } catch (err) {
    error.value = 'Failed to analyze settings'
    console.error('Error analyzing settings:', err)
  } finally {
    analyzing.value = false
  }
}

const applySuggestion = async (suggestion: OptimizationSuggestion) => {
  applying.value = true
  error.value = null

  try {
    const success = await settingsStore.applyOptimization(suggestion)
    if (!success) {
      throw new Error('Failed to apply optimization')
    }
  } catch (err) {
    error.value = 'Failed to apply optimization'
    console.error('Error applying optimization:', err)
  } finally {
    applying.value = false
  }
}

const dismissSuggestion = (id: string) => {
  // Implementation for dismissing suggestions
  console.log('Dismissing suggestion:', id)
}

const formatTimestamp = (timestamp: string) => {
  return format(new Date(timestamp), 'MMM d, HH:mm')
}

const formatHistoryChanges = (item: OptimizationHistory) => {
  const count = item.changes.length
  return count === 1
    ? `Updated ${item.changes[0].setting}`
    : `Updated ${count} settings`
}

const formatImpact = (key: string, value: number) => {
  return `${key}: ${value > 0 ? '+' : ''}${value}%`
}

const getHistoryColor = (item: OptimizationHistory) => {
  return item.type === 'automatic' ? 'primary' : 'success'
}

const getImpactColor = (value: number) => {
  if (value > 0) return 'success'
  if (value < 0) return 'error'
  return 'grey'
}

const startRefreshTimer = () => {
  if (props.config.autoRefresh) {
    refreshTimer.value = window.setInterval(
      analyzeSettings,
      props.config.refreshInterval
    )
  }
}

const stopRefreshTimer = () => {
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value)
    refreshTimer.value = null
  }
}

// Lifecycle
onMounted(() => {
  analyzeSettings()
  startRefreshTimer()
})

onBeforeUnmount(() => {
  stopRefreshTimer()
})
</script>