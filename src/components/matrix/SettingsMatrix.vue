/**
 * Main SettingsMatrix component
 */
<template>
  <v-card>
    <v-card-title class="d-flex align-center">
      Settings Matrix
      <v-spacer></v-spacer>
      <!-- Actions -->
      <v-btn
        icon="mdi-refresh"
        variant="text"
        @click="refreshMatrix"
        :loading="loading"
      />
    </v-card-title>

    <!-- Legend -->
    <category-legend :categories="categoryLegend" />

    <v-card-text class="pa-0">
      <div class="matrix-container">
        <!-- Column Headers -->
        <div class="matrix-header">
          <matrix-cell
            v-for="header in columnHeaders"
            :key="header"
            :is-header="true"
            :header-value="header"
          />
        </div>

        <!-- Matrix Rows -->
        <div
          v-for="row in matrixRows"
          :key="row.id"
          class="matrix-row"
        >
          <!-- Row Header -->
          <matrix-cell
            :is-header="true"
            :header-value="row.id"
          />

          <!-- Row Cells -->
          <matrix-cell
            v-for="cell in row.cells"
            :key="cell.code"
            :cell="cell"
            :show-tooltip="config.showTooltips"
            @cell-click="handleCellClick"
            @cell-hover="handleCellHover"
            @cell-leave="handleCellLeave"
          />
        </div>
      </div>
    </v-card-text>

    <!-- Setting Edit Dialog -->
    <setting-dialog
      v-model="showDialog"
      :setting="selectedSetting?.setting"
      :current-value="selectedSetting?.value"
      :validation-error="selectedSetting?.validationError"
      @save="handleSettingSave"
      @cancel="handleSettingCancel"
    />

    <!-- Hover Preview -->
    <v-menu
      v-model="showPreview"
      location="top"
      :position-x="previewX"
      :position-y="previewY"
      transition="fade-transition"
      open-delay="500"
    >
      <v-card
        v-if="hoveredSetting"
        width="300"
        elevation="4"
      >
        <v-card-title class="text-subtitle-1">
          {{ hoveredSetting.setting.name }}
        </v-card-title>
        <v-card-text>
          <div class="text-body-2">{{ hoveredSetting.setting.description }}</div>
          <v-divider class="my-2"></v-divider>
          <div class="d-flex justify-space-between">
            <span class="text-caption">Type: {{ hoveredSetting.setting.type }}</span>
            <span class="text-caption">Access: {{ hoveredSetting.setting.access }}</span>
          </div>
        </v-card-text>
      </v-card>
    </v-menu>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useSettingsStore } from '@/store/settingsStore'
import { SettingCategory } from '@/types'
import type { GridCell, GridSection, CategoryLegend, MatrixConfig } from './types'
import MatrixCell from './components/MatrixCell.vue'
import CategoryLegend from './components/CategoryLegend.vue'
import SettingDialog from './components/SettingDialog.vue'

// Props & Config
const props = withDefaults(defineProps<{
  config?: Partial<MatrixConfig>
}>(), {
  config: () => ({
    allowDirectEdit: true,
    showValidation: true,
    showModified: true,
    showTooltips: true
  })
})

// Store
const settingsStore = useSettingsStore()

// State
const loading = ref(false)
const showDialog = ref(false)
const showPreview = ref(false)
const previewX = ref(0)
const previewY = ref(0)
const selectedSetting = ref<GridCell | null>(null)
const hoveredSetting = ref<GridCell | null>(null)

// Column headers (0-F)
const columnHeaders = computed(() => 
  Array.from({ length: 16 }, (_, i) => i.toString(16).toUpperCase())
)

// Matrix data structure
const matrixRows = computed(() => {
  const rows: GridSection[] = []
  
  // Create 16 rows (0-F)
  for (let i = 0; i < 16; i++) {
    const rowId = i.toString(16).toUpperCase()
    const cells: GridCell[] = []

    // Create 16 columns for each row
    for (let j = 0; j < 16; j++) {
      const colId = j.toString(16).toUpperCase()
      const code = `${rowId}${colId}`
      const setting = settingsStore.getSettingByCode(code)

      if (setting) {
        cells.push({
          code,
          value: settingsStore.currentSettings[code] || '00',
          setting,
          isValid: !settingsStore.validationErrors[code],
          isModified: settingsStore.currentSettings[code] !== settingsStore.originalSettings[code],
          validationError: settingsStore.validationErrors[code]?.errors?.[0]
        })
      }
    }

    if (cells.length > 0) {
      rows.push({
        id: rowId,
        title: `Row ${rowId}`,
        cells,
        category: cells[0].setting.category
      })
    }
  }

  return rows
})

// Category legend data
const categoryLegend = computed<CategoryLegend[]>(() => [
  {
    name: SettingCategory.ROOM,
    color: 'primary',
    icon: 'mdi-home'
  },
  {
    name: SettingCategory.MAIN_ZONE,
    color: 'secondary',
    icon: 'mdi-thermostat'
  },
  {
    name: SettingCategory.ADDITIONAL_ZONE,
    color: 'success',
    icon: 'mdi-thermostat-box'
  },
  {
    name: SettingCategory.SPACE_HEATING_COOLING,
    color: 'warning',
    icon: 'mdi-hvac'
  },
  {
    name: SettingCategory.TANK,
    color: 'info',
    icon: 'mdi-water-boiler'
  },
  {
    name: SettingCategory.USER_SETTINGS,
    color: 'error',
    icon: 'mdi-account-cog'
  },
  {
    name: SettingCategory.INSTALLER_SETTINGS,
    color: 'grey',
    icon: 'mdi-wrench'
  }
])

// Methods
const refreshMatrix = async () => {
  loading.value = true
  try {
    await settingsStore.validateAllSettings()
  } finally {
    loading.value = false
  }
}

const handleCellClick = (cell: GridCell) => {
  if (!props.config.allowDirectEdit) return
  
  selectedSetting.value = cell
  showDialog.value = true
}

const handleCellHover = (cell: GridCell, event: MouseEvent) => {
  if (!props.config.showTooltips) return

  hoveredSetting.value = cell
  previewX.value = event.clientX
  previewY.value = event.clientY
  showPreview.value = true
}

const handleCellLeave = () => {
  showPreview.value = false
  hoveredSetting.value = null
}

const handleSettingSave = async (value: string) => {
  if (!selectedSetting.value) return

  const result = await settingsStore.updateSetting(
    selectedSetting.value.code,
    value
  )

  if (!result.success) {
    // Handle error
    console.error('Failed to update setting:', result.errors)
  }

  selectedSetting.value = null
  showDialog.value = false
}

const handleSettingCancel = () => {
  selectedSetting.value = null
  showDialog.value = false
}

// Lifecycle
onMounted(() => {
  refreshMatrix()
})
</script>

<style scoped>
.matrix-container {
  overflow-x: auto;
  padding: 1rem;
}

.matrix-header {
  display: flex;
  position: sticky;
  top: 0;
  z-index: 1;
  background: rgb(var(--v-theme-surface));
}

.matrix-row {
  display: flex;
}
</style>