<template>
  <v-card>
    <v-card-title class="d-flex align-center">
      Settings Matrix
      <v-spacer></v-spacer>
      <v-btn
        icon
        variant="text"
        @click="toggleLegend"
      >
        <v-icon>mdi-help-circle</v-icon>
      </v-btn>
    </v-card-title>

    <v-card-text>
      <!-- Legend -->
      <v-expand-transition>
        <div v-show="showLegend" class="mb-4">
          <v-chip-group>
            <v-chip
              v-for="category in categories"
              :key="category.name"
              :color="category.color"
              label
              text-color="white"
            >
              {{ category.name }}
            </v-chip>
          </v-chip-group>
        </div>
      </v-expand-transition>

      <!-- Matrix Grid -->
      <div class="matrix-container">
        <!-- Column Headers -->
        <div class="matrix-header">
          <div class="matrix-cell header"></div>
          <div
            v-for="col in 15"
            :key="'col-' + col.toString(16)"
            class="matrix-cell header"
          >
            {{ col.toString(16).toUpperCase() }}
          </div>
        </div>

        <!-- Matrix Rows -->
        <div
          v-for="row in 15"
          :key="'row-' + row.toString(16)"
          class="matrix-row"
        >
          <div class="matrix-cell header">
            {{ row.toString(16).toUpperCase() }}
          </div>
          <div
            v-for="col in 15"
            :key="'cell-' + row.toString(16) + col.toString(16)"
            class="matrix-cell"
            :class="getCellClass(row, col)"
            @click="openSettingDialog(row, col)"
          >
            {{ getSettingValue(row, col) }}
          </div>
        </div>
      </div>
    </v-card-text>

    <!-- Setting Edit Dialog -->
    <v-dialog
      v-model="dialog"
      max-width="500px"
    >
      <v-card v-if="selectedSetting">
        <v-card-title>
          Edit Setting {{ selectedSetting.id }}
        </v-card-title>
        <v-card-text>
          <v-text-field
            v-model="selectedSetting.value"
            :label="selectedSetting.description"
            :hint="selectedSetting.range"
            persistent-hint
            @input="validateSetting"
          ></v-text-field>
          <v-alert
            v-if="validationError"
            type="error"
            class="mt-2"
            density="compact"
          >
            {{ validationError }}
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            text
            @click="dialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            @click="saveSetting"
            :disabled="!!validationError"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup>
import { ref, computed } from 'vue'

const showLegend = ref(false)
const dialog = ref(false)
const selectedSetting = ref(null)
const validationError = ref('')

// Sample categories - these would come from your data store
const categories = ref([
  { name: 'Temperature', color: 'red' },
  { name: 'Operation Mode', color: 'blue' },
  { name: 'System Config', color: 'green' },
  { name: 'Sensor Settings', color: 'purple' }
])

// Sample matrix data - this would come from your data store
const matrixData = ref({})

const toggleLegend = () => {
  showLegend.value = !showLegend.value
}

const getCellClass = (row, col) => {
  // Implementation would determine cell category and return appropriate styling
  return {
    'temperature': row < 4,
    'operation-mode': row >= 4 && row < 8,
    'system-config': row >= 8 && row < 12,
    'sensor-settings': row >= 12
  }
}

const getSettingValue = (row, col) => {
  const id = `${row.toString(16)}${col.toString(16)}`.toUpperCase()
  return matrixData.value[id] || '00'
}

const openSettingDialog = (row, col) => {
  const id = `${row.toString(16)}${col.toString(16)}`.toUpperCase()
  selectedSetting.value = {
    id,
    value: matrixData.value[id] || '00',
    description: 'Sample Setting Description',
    range: 'Valid range: 00-FF'
  }
  dialog.value = true
}

const validateSetting = (value) => {
  if (!value.match(/^[0-9A-F]{2}$/i)) {
    validationError.value = 'Value must be a 2-digit hexadecimal number (00-FF)'
  } else {
    validationError.value = ''
  }
}

const saveSetting = () => {
  if (!validationError.value) {
    matrixData.value[selectedSetting.value.id] = selectedSetting.value.value.toUpperCase()
    dialog.value = false
  }
}
</script>

<style scoped>
.matrix-container {
  overflow-x: auto;
}

.matrix-header {
  display: flex;
  position: sticky;
  top: 0;
  background: var(--v-theme-background);
}

.matrix-row {
  display: flex;
}

.matrix-cell {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #ccc;
  cursor: pointer;
  transition: background-color 0.2s;
}

.matrix-cell:hover:not(.header) {
  background-color: rgba(var(--v-theme-primary), 0.1);
}

.matrix-cell.header {
  background-color: rgba(var(--v-theme-primary), 0.05);
  font-weight: bold;
  cursor: default;
}

.temperature {
  background-color: rgba(255, 0, 0, 0.1);
}

.operation-mode {
  background-color: rgba(0, 0, 255, 0.1);
}

.system-config {
  background-color: rgba(0, 255, 0, 0.1);
}

.sensor-settings {
  background-color: rgba(128, 0, 128, 0.1);
}
</style>