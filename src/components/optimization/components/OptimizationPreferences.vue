/**
 * Optimization preferences configuration component
 */
<template>
  <v-card flat>
    <v-card-title class="text-subtitle-1">
      Optimization Preferences
    </v-card-title>

    <v-card-text>
      <!-- Priority Settings -->
      <v-list>
        <v-list-item>
          <v-switch
            v-model="localPreferences.prioritizeEfficiency"
            label="Prioritize Energy Efficiency"
            color="success"
            hide-details
            @change="updatePreferences"
          >
            <template v-slot:prepend>
              <v-icon color="success">mdi-leaf</v-icon>
            </template>
          </v-switch>
        </v-list-item>

        <v-list-item>
          <v-switch
            v-model="localPreferences.prioritizeComfort"
            label="Prioritize Comfort"
            color="primary"
            hide-details
            @change="updatePreferences"
          >
            <template v-slot:prepend>
              <v-icon color="primary">mdi-sofa</v-icon>
            </template>
          </v-switch>
        </v-list-item>

        <v-list-item>
          <v-switch
            v-model="localPreferences.scheduleOptimization"
            label="Enable Schedule Optimization"
            color="info"
            hide-details
            @change="updatePreferences"
          >
            <template v-slot:prepend>
              <v-icon color="info">mdi-clock-outline</v-icon>
            </template>
          </v-switch>
        </v-list-item>

        <v-list-item>
          <v-switch
            v-model="localPreferences.allowAutomaticUpdates"
            label="Allow Automatic Updates"
            color="warning"
            hide-details
            @change="updatePreferences"
          >
            <template v-slot:prepend>
              <v-icon color="warning">mdi-sync</v-icon>
            </template>
          </v-switch>
        </v-list-item>
      </v-list>

      <!-- Temperature Change Limit -->
      <v-list-item>
        <template v-slot:prepend>
          <v-icon color="error">mdi-thermometer</v-icon>
        </template>
        <v-slider
          v-model="localPreferences.maxTemperatureChange"
          label="Maximum Temperature Change"
          :min="1"
          :max="5"
          :step="0.5"
          thumb-label
          hide-details
          @update:modelValue="updatePreferences"
        >
          <template v-slot:append>
            <v-text-field
              v-model="localPreferences.maxTemperatureChange"
              type="number"
              style="width: 70px"
              density="compact"
              hide-details
              @update:modelValue="updatePreferences"
            ></v-text-field>
            <span class="ml-1">°C</span>
          </template>
        </v-slider>
      </v-list-item>
    </v-card-text>

    <!-- Help Text -->
    <v-card-text class="text-caption text-medium-emphasis">
      <v-icon
        icon="mdi-information"
        size="small"
        color="info"
        class="mr-1"
      ></v-icon>
      These preferences will be used to customize optimization suggestions and automatic adjustments.
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { OptimizationPreferences } from '../types'
import { useSettingsStore } from '@/store/settingsStore'

const props = defineProps<{
  preferences: OptimizationPreferences
}>()

const emit = defineEmits<{
  'update:preferences': [preferences: OptimizationPreferences]
}>()

// Store
const settingsStore = useSettingsStore()

// State
const localPreferences = ref<OptimizationPreferences>({ ...props.preferences })

// Methods
const updatePreferences = () => {
  emit('update:preferences', { ...localPreferences.value })
  // Update store preferences
  settingsStore.updatePreferences({
    prioritizeEfficiency: localPreferences.value.prioritizeEfficiency,
    prioritizeComfort: localPreferences.value.prioritizeComfort
  })
}

// Watch for external changes
watch(() => props.preferences, (newPrefs) => {
  localPreferences.value = { ...newPrefs }
}, { deep: true })
</script>