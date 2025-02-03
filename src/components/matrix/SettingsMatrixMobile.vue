/**
 * Mobile-optimized settings matrix view
 */
<template>
  <div class="settings-matrix-mobile">
    <!-- Mobile Header -->
    <div class="d-flex align-center mb-4">
      <v-text-field
        v-model="searchQuery"
        prepend-inner-icon="mdi-magnify"
        label="Search settings"
        density="comfortable"
        hide-details
        class="flex-grow-1"
        clearable
      ></v-text-field>

      <v-btn
        icon="mdi-filter-variant"
        variant="text"
        class="ml-2"
        @click="showFilters = true"
      ></v-btn>
    </div>

    <!-- Category Chips -->
    <div class="category-chips mb-4">
      <v-slide-group
        v-model="selectedCategory"
        selected-class="bg-primary"
        show-arrows
      >
        <v-slide-group-item
          v-for="category in categories"
          :key="category.id"
          v-slot="{ isSelected, toggle }"
          :value="category.id"
        >
          <v-chip
            class="ma-1"
            :color="isSelected ? 'primary' : undefined"
            :variant="isSelected ? 'elevated' : 'tonal'"
            @click="toggle"
          >
            {{ category.name }}
          </v-chip>
        </v-slide-group-item>
      </v-slide-group>
    </div>

    <!-- Settings List -->
    <v-list class="settings-list">
      <template v-for="group in filteredSettings" :key="group.category">
        <v-list-subheader>{{ group.category }}</v-list-subheader>
        
        <v-list-item
          v-for="setting in group.settings"
          :key="setting.code"
          :title="setting.name"
          :subtitle="setting.description"
          :value="setting.code"
          @click="openSetting(setting)"
        >
          <!-- Setting Value -->
          <template v-slot:append>
            <v-chip
              :color="getSettingColor(setting)"
              size="small"
              label
              class="setting-value"
            >
              {{ formatValue(setting) }}
            </v-chip>
          </template>
        </v-list-item>

        <v-divider></v-divider>
      </template>
    </v-list>

    <!-- Filter Dialog -->
    <v-dialog v-model="showFilters" max-width="300">
      <v-card>
        <v-card-title>Filter Settings</v-card-title>
        <v-card-text>
          <v-list>
            <!-- Filter by Category -->
            <v-list-subheader>Categories</v-list-subheader>
            <v-list-item v-for="cat in categories" :key="cat.id">
              <v-checkbox
                v-model="selectedCategories"
                :label="cat.name"
                :value="cat.id"
                density="comfortable"
                hide-details
              ></v-checkbox>
            </v-list-item>

            <v-divider class="my-2"></v-divider>

            <!-- Filter by Type -->
            <v-list-subheader>Types</v-list-subheader>
            <v-list-item v-for="type in settingTypes" :key="type.id">
              <v-checkbox
                v-model="selectedTypes"
                :label="type.name"
                :value="type.id"
                density="comfortable"
                hide-details
              ></v-checkbox>
            </v-list-item>

            <!-- Show Modified Only -->
            <v-list-item>
              <v-checkbox
                v-model="showModifiedOnly"
                label="Show Modified Only"
                density="comfortable"
                hide-details
              ></v-checkbox>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="resetFilters"
          >
            Reset
          </v-btn>
          <v-btn
            color="primary"
            @click="showFilters = false"
          >
            Apply
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Setting Edit Dialog -->
    <v-dialog v-model="showSettingDialog" max-width="400">
      <v-card v-if="selectedSetting">
        <v-card-title>
          {{ selectedSetting.name }}
        </v-card-title>
        <v-card-text>
          <!-- Description -->
          <div class="text-body-2 mb-4">
            {{ selectedSetting.description }}
          </div>

          <!-- Value Input -->
          <template v-if="selectedSetting.range.type === 'numeric'">
            <v-slider
              v-model="editValue"
              :min="selectedSetting.range.min"
              :max="selectedSetting.range.max"
              :step="selectedSetting.range.step"
              thumb-label
              class="mb-2"
            >
              <template v-slot:append>
                <v-text-field
                  v-model="editValue"
                  type="number"
                  style="width: 100px"
                  density="compact"
                  hide-details
                ></v-text-field>
              </template>
            </v-slider>
          </template>

          <template v-else-if="selectedSetting.range.type === 'enum'">
            <v-select
              v-model="editValue"
              :items="enumItems"
              item-title="text"
              item-value="value"
              density="comfortable"
            ></v-select>
          </template>

          <template v-else>
            <v-text-field
              v-model="editValue"
              :label="selectedSetting.name"
              density="comfortable"
              maxlength="2"
            ></v-text-field>
          </template>

          <!-- Validation Error -->
          <v-alert
            v-if="validationError"
            type="error"
            variant="tonal"
            density="compact"
            class="mt-2"
          >
            {{ validationError }}
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-btn
            variant="text"
            @click="showSettingDialog = false"
          >
            Cancel
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            @click="saveSetting"
            :disabled="!hasChanges || !!validationError"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useSettingsStore } from '@/store/settingsStore'
import type { Setting } from '@/types'

// Store
const settingsStore = useSettingsStore()

// State
const searchQuery = ref('')
const selectedCategory = ref<string | null>(null)
const selectedCategories = ref<string[]>([])
const selectedTypes = ref<string[]>([])
const showModifiedOnly = ref(false)
const showFilters = ref(false)
const showSettingDialog = ref(false)
const selectedSetting = ref<Setting | null>(null)
const editValue = ref('')
const validationError = ref('')

// Computed
const categories = computed(() => [
  // ... category definitions
])

const settingTypes = computed(() => [
  // ... setting type definitions
])

const filteredSettings = computed(() => {
  let settings = Object.values(settingsStore.settingsDatabase)

  // Apply search
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    settings = settings.filter(setting => 
      setting.name.toLowerCase().includes(query) ||
      setting.description?.toLowerCase().includes(query) ||
      setting.code.toLowerCase().includes(query)
    )
  }

  // Apply category filter
  if (selectedCategories.value.length) {
    settings = settings.filter(setting =>
      selectedCategories.value.includes(setting.category)
    )
  }

  // Apply type filter
  if (selectedTypes.value.length) {
    settings = settings.filter(setting =>
      selectedTypes.value.includes(setting.type)
    )
  }

  // Show modified only
  if (showModifiedOnly.value) {
    settings = settings.filter(setting =>
      settingsStore.currentSettings[setting.code] !==
      settingsStore.originalSettings[setting.code]
    )
  }

  // Group by category
  return Object.entries(
    settings.reduce((groups, setting) => {
      const category = setting.category
      if (!groups[category]) {
        groups[category] = []
      }
      groups[category].push(setting)
      return groups
    }, {} as Record<string, Setting[]>)
  ).map(([category, settings]) => ({
    category,
    settings: settings.sort((a, b) => a.name.localeCompare(b.name))
  }))
})

const enumItems = computed(() => {
  if (!selectedSetting.value?.range.type === 'enum') return []
  
  return Object.entries(selectedSetting.value.range.options).map(([value, text]) => ({
    value,
    text
  }))
})

const hasChanges = computed(() => {
  if (!selectedSetting.value) return false
  const currentValue = settingsStore.currentSettings[selectedSetting.value.code]
  return editValue.value !== currentValue
})

// Methods
const openSetting = (setting: Setting) => {
  selectedSetting.value = setting
  editValue.value = settingsStore.currentSettings[setting.code]
  showSettingDialog.value = true
}

const saveSetting = async () => {
  if (!selectedSetting.value) return

  try {
    await settingsStore.updateSetting(
      selectedSetting.value.code,
      editValue.value
    )
    showSettingDialog.value = false
  } catch (error) {
    validationError.value = error instanceof Error
      ? error.message
      : 'Failed to save setting'
  }
}

const resetFilters = () => {
  selectedCategories.value = []
  selectedTypes.value = []
  showModifiedOnly.value = false
}

const getSettingColor = (setting: Setting) => {
  const current = settingsStore.currentSettings[setting.code]
  const original = settingsStore.originalSettings[setting.code]
  
  if (current !== original) {
    return 'warning'
  }
  return undefined
}

const formatValue = (setting: Setting) => {
  const value = settingsStore.currentSettings[setting.code]
  
  if (setting.range.type === 'enum') {
    return setting.range.options[value] || value
  }
  
  return value
}
</script>

<style scoped>
.settings-matrix-mobile {
  max-width: 100%;
  overflow-x: hidden;
}

.category-chips {
  max-width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.settings-list {
  border-radius: var(--v-card-border-radius);
  background-color: var(--v-theme-surface);
}

.setting-value {
  min-width: 60px;
  text-align: center;
}

/* Touch optimizations */
@media (pointer: coarse) {
  .v-list-item {
    min-height: 64px;
    padding: 12px 16px;
  }

  .v-chip {
    height: 32px;
  }
}
</style>