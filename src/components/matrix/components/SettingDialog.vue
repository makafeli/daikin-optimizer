/**
 * Dialog component for editing settings
 */
<template>
  <v-dialog
    v-model="dialog"
    max-width="600px"
    @click:outside="handleCancel"
  >
    <v-card>
      <v-card-title class="d-flex align-center">
        <span>Edit Setting: {{ setting?.name }}</span>
        <v-spacer></v-spacer>
        <v-chip
          :color="accessColor"
          size="small"
        >
          {{ setting?.access }}
        </v-chip>
      </v-card-title>

      <v-card-text>
        <!-- Setting description -->
        <div class="text-body-2 mb-4">
          {{ setting?.description || 'No description available' }}
        </div>

        <!-- Value input -->
        <div class="d-flex align-center gap-4">
          <template v-if="setting?.range.type === 'numeric'">
            <!-- Numeric input with slider -->
            <v-slider
              v-model="localValue"
              :min="setting.range.min"
              :max="setting.range.max"
              :step="setting.range.step"
              :error="!!validationError"
              thumb-label
              class="flex-grow-1"
            >
              <template v-slot:append>
                <v-text-field
                  v-model="localValue"
                  type="number"
                  density="compact"
                  style="width: 100px"
                  hide-details
                  :error="!!validationError"
                ></v-text-field>
              </template>
            </v-slider>
          </template>

          <template v-else-if="setting?.range.type === 'enum'">
            <!-- Enum select -->
            <v-select
              v-model="localValue"
              :items="enumItems"
              density="compact"
              :error="!!validationError"
              class="flex-grow-1"
            ></v-select>
          </template>

          <template v-else-if="setting?.range.type === 'boolean'">
            <!-- Boolean switch -->
            <v-switch
              v-model="localValueBoolean"
              :label="localValueBoolean ? setting.range.options.true : setting.range.options.false"
              :error="!!validationError"
              hide-details
            ></v-switch>
          </template>

          <template v-else>
            <!-- Default text input -->
            <v-text-field
              v-model="localValue"
              density="compact"
              :error="!!validationError"
              class="flex-grow-1"
              maxlength="2"
            ></v-text-field>
          </template>
        </div>

        <!-- Validation error -->
        <v-alert
          v-if="validationError"
          type="error"
          variant="tonal"
          density="compact"
          class="mt-4"
        >
          {{ validationError.message }}
        </v-alert>

        <!-- Original value reference -->
        <div class="mt-4 text-caption">
          Original value: {{ originalValue }}
        </div>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          variant="text"
          @click="handleCancel"
        >
          Cancel
        </v-btn>
        <v-btn
          color="primary"
          :disabled="!isValid || !hasChanged"
          @click="handleSave"
        >
          Save
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Setting, ValidationResult } from '@/types'

const props = defineProps<{
  modelValue: boolean
  setting?: Setting
  currentValue?: string
  validationError?: ValidationResult['errors'][0]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'save': [value: string]
  'cancel': []
}>()

// State
const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const localValue = ref(props.currentValue || '')
const originalValue = ref(props.currentValue || '')

// Computed
const localValueBoolean = computed({
  get: () => localValue.value === '1',
  set: (value) => { localValue.value = value ? '1' : '0' }
})

const accessColor = computed(() => {
  switch (props.setting?.access) {
    case 'R/W': return 'success'
    case 'R/O': return 'warning'
    default: return 'error'
  }
})

const enumItems = computed(() => {
  if (props.setting?.range.type !== 'enum') return []
  return Object.entries(props.setting.range.options).map(([value, label]) => ({
    title: label,
    value
  }))
})

const isValid = computed(() => !props.validationError)

const hasChanged = computed(() => localValue.value !== originalValue.value)

// Methods
const handleSave = () => {
  emit('save', localValue.value)
  dialog.value = false
}

const handleCancel = () => {
  localValue.value = originalValue.value
  emit('cancel')
  dialog.value = false
}

// Watch for external value changes
watch(() => props.currentValue, (newValue) => {
  if (newValue !== undefined) {
    localValue.value = newValue
    originalValue.value = newValue
  }
})
</script>