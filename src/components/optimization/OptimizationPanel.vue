<template>
  <v-card class="mb-4">
    <v-card-title>
      Settings Optimization
      <v-spacer></v-spacer>
      <v-btn
        color="primary"
        @click="analyzeSettings"
        :loading="analyzing"
      >
        Analyze Settings
      </v-btn>
    </v-card-title>

    <v-card-text>
      <!-- Optimization Score -->
      <v-row align="center" class="mb-4">
        <v-col cols="12" sm="6">
          <div class="text-h6">Efficiency Score</div>
          <v-progress-circular
            :model-value="efficiencyScore"
            :color="efficiencyScoreColor"
            size="100"
            width="15"
          >
            {{ efficiencyScore }}%
          </v-progress-circular>
        </v-col>
        <v-col cols="12" sm="6">
          <v-list density="compact">
            <v-list-item>
              <template v-slot:prepend>
                <v-icon :color="energyScoreColor">mdi-lightning-bolt</v-icon>
              </template>
              <v-list-item-title>Energy Efficiency</v-list-item-title>
              <v-list-item-subtitle>{{ energyScore }}%</v-list-item-subtitle>
            </v-list-item>
            <v-list-item>
              <template v-slot:prepend>
                <v-icon :color="comfortScoreColor">mdi-thermostat</v-icon>
              </template>
              <v-list-item-title>Comfort Level</v-list-item-title>
              <v-list-item-subtitle>{{ comfortScore }}%</v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-col>
      </v-row>

      <!-- Optimization Suggestions -->
      <v-expansion-panels>
        <v-expansion-panel
          v-for="suggestion in optimizationSuggestions"
          :key="suggestion.id"
        >
          <v-expansion-panel-title>
            <v-row no-gutters>
              <v-col cols="2">
                <v-icon
                  :color="getSeverityColor(suggestion.severity)"
                  class="mr-2"
                >
                  {{ getSeverityIcon(suggestion.severity) }}
                </v-icon>
              </v-col>
              <v-col>
                {{ suggestion.title }}
              </v-col>
            </v-row>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-card-text>
              <p>{{ suggestion.description }}</p>
              <v-divider class="my-2"></v-divider>
              <div class="text-subtitle-2">Affected Settings:</div>
              <v-chip-group>
                <v-chip
                  v-for="setting in suggestion.affectedSettings"
                  :key="setting.code"
                  :color="setting.color"
                  label
                >
                  {{ setting.name }}
                </v-chip>
              </v-chip-group>
              <v-divider class="my-2"></v-divider>
              <div class="text-subtitle-2">Recommended Actions:</div>
              <v-list density="compact">
                <v-list-item
                  v-for="(action, index) in suggestion.recommendedActions"
                  :key="index"
                >
                  <template v-slot:prepend>
                    <v-icon color="primary">mdi-check-circle</v-icon>
                  </template>
                  {{ action }}
                </v-list-item>
              </v-list>
              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn
                  color="primary"
                  @click="applyRecommendation(suggestion)"
                  :disabled="!suggestion.canAutoApply"
                >
                  Apply Changes
                </v-btn>
              </v-card-actions>
            </v-card-text>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>

      <!-- Historical Performance -->
      <v-card-subtitle class="mt-4">Historical Performance</v-card-subtitle>
      <v-chart
        class="chart"
        :option="chartOption"
        autoresize
      />
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
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
import { useSettingsStore } from '@/store/settingsStore'

// Initialize ECharts components
use([
  CanvasRenderer,
  LineChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
])

const settingsStore = useSettingsStore()
const analyzing = ref(false)

// Computed Properties
const efficiencyScore = ref(85)
const energyScore = ref(82)
const comfortScore = ref(88)

const efficiencyScoreColor = computed(() => {
  if (efficiencyScore.value >= 80) return 'success'
  if (efficiencyScore.value >= 60) return 'warning'
  return 'error'
})

const energyScoreColor = computed(() => {
  if (energyScore.value >= 80) return 'success'
  if (energyScore.value >= 60) return 'warning'
  return 'error'
})

const comfortScoreColor = computed(() => {
  if (comfortScore.value >= 80) return 'success'
  if (comfortScore.value >= 60) return 'warning'
  return 'error'
})

const optimizationSuggestions = ref([
  {
    id: 1,
    severity: 'high',
    title: 'Heating Curve Optimization',
    description: 'Current heating curve settings may be inefficient for your climate zone.',
    affectedSettings: [
      { code: '1-00', name: 'Heating Curve Low Point', color: 'blue' },
      { code: '1-01', name: 'Heating Curve High Point', color: 'red' }
    ],
    recommendedActions: [
      'Adjust low point temperature to -10°C',
      'Reduce high point temperature by 2°C'
    ],
    canAutoApply: true
  },
  {
    id: 2,
    severity: 'medium',
    title: 'DHW Schedule Optimization',
    description: 'DHW preparation schedule can be optimized based on usage patterns.',
    affectedSettings: [
      { code: '6-0A', name: 'DHW Comfort Setpoint', color: 'purple' }
    ],
    recommendedActions: [
      'Lower comfort temperature during low-usage periods',
      'Adjust schedule to pre-heat before peak usage times'
    ],
    canAutoApply: true
  }
])

// Chart Configuration
const chartOption = ref({
  title: {
    text: 'System Performance',
    left: 'center'
  },
  tooltip: {
    trigger: 'axis'
  },
  legend: {
    data: ['Energy Consumption', 'Efficiency'],
    bottom: 0
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '15%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  },
  yAxis: [
    {
      type: 'value',
      name: 'kWh',
      min: 0,
      max: 100
    },
    {
      type: 'value',
      name: 'COP',
      min: 0,
      max: 5
    }
  ],
  series: [
    {
      name: 'Energy Consumption',
      type: 'line',
      data: [30, 35, 33, 38, 32, 30, 28]
    },
    {
      name: 'Efficiency',
      type: 'line',
      yAxisIndex: 1,
      data: [4.2, 4.0, 4.1, 3.8, 4.0, 4.2, 4.3]
    }
  ]
})

// Methods
const getSeverityColor = (severity) => {
  const colors = {
    high: 'error',
    medium: 'warning',
    low: 'success'
  }
  return colors[severity] || 'info'
}

const getSeverityIcon = (severity) => {
  const icons = {
    high: 'mdi-alert-circle',
    medium: 'mdi-alert',
    low: 'mdi-information'
  }
  return icons[severity] || 'mdi-help-circle'
}

const analyzeSettings = async () => {
  analyzing.value = true
  try {
    // Simulate analysis
    await new Promise(resolve => setTimeout(resolve, 2000))
    // In real implementation, this would analyze current settings and generate recommendations
    analyzing.value = false
  } catch (error) {
    console.error('Error analyzing settings:', error)
    analyzing.value = false
  }
}

const applyRecommendation = async (suggestion) => {
  try {
    // Implementation for applying recommended changes
    console.log('Applying recommendation:', suggestion.id)
    // Update settings in store
    // Refresh analysis
  } catch (error) {
    console.error('Error applying recommendation:', error)
  }
}

onMounted(() => {
  // Initial analysis
  analyzeSettings()
})
</script>

<style scoped>
.chart {
  height: 300px;
}
</style>