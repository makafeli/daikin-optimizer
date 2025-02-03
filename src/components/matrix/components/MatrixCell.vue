/**
 * Cell component for the settings matrix
 */
<template>
  <div
    class="matrix-cell"
    :class="{
      'header': isHeader,
      'modified': !isHeader && cell.isModified,
      'invalid': !isHeader && !cell.isValid,
      [categoryClass]: !isHeader && cell.setting
    }"
    @click="!isHeader && handleClick()"
    @mouseenter="!isHeader && handleMouseEnter"
    @mouseleave="!isHeader && handleMouseLeave"
  >
    <template v-if="isHeader">
      {{ headerValue }}
    </template>
    <template v-else>
      <v-tooltip
        v-if="showTooltip"
        :text="tooltipText"
        location="top"
        open-delay="500"
      >
        <template v-slot:activator="{ props }">
          <span v-bind="props">
            {{ displayValue }}
          </span>
        </template>
      </v-tooltip>
      <span v-else>{{ displayValue }}</span>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { GridCell } from '../types'
import { SettingCategory } from '@/types'

const props = defineProps<{
  cell?: GridCell
  isHeader?: boolean
  headerValue?: string
  showTooltip?: boolean
}>()

const emit = defineEmits<{
  'cell-click': [cell: GridCell]
  'cell-hover': [cell: GridCell, event: MouseEvent]
  'cell-leave': [cell: GridCell]
}>()

// Computed
const categoryClass = computed(() => {
  if (!props.cell?.setting) return ''
  return `category-${props.cell.setting.category.toLowerCase().replace(/\s+/g, '-')}`
})

const displayValue = computed(() => {
  if (!props.cell) return ''
  return props.cell.value.toUpperCase()
})

const tooltipText = computed(() => {
  if (!props.cell?.setting) return ''
  
  let text = `${props.cell.setting.name}\n`
  text += `Type: ${props.cell.setting.type}\n`
  text += `Access: ${props.cell.setting.access}\n`
  
  if (props.cell.setting.description) {
    text += `\n${props.cell.setting.description}`
  }
  
  if (!props.cell.isValid && props.cell.validationError) {
    text += `\n\nError: ${props.cell.validationError.message}`
  }
  
  return text
})

// Methods
const handleClick = () => {
  if (props.cell) {
    emit('cell-click', props.cell)
  }
}

const handleMouseEnter = (event: MouseEvent) => {
  if (props.cell) {
    emit('cell-hover', props.cell, event)
  }
}

const handleMouseLeave = () => {
  if (props.cell) {
    emit('cell-leave', props.cell)
  }
}
</script>

<style scoped>
.matrix-cell {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(var(--v-border-color), 0.12);
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: monospace;
  position: relative;
}

.matrix-cell:not(.header):hover {
  background-color: rgba(var(--v-theme-primary), 0.1);
}

.matrix-cell.header {
  background-color: rgba(var(--v-theme-surface-variant), 0.1);
  font-weight: bold;
  cursor: default;
}

.matrix-cell.modified {
  font-weight: bold;
}

.matrix-cell.invalid {
  color: rgb(var(--v-theme-error));
}

/* Category styles */
.category-room {
  background-color: rgba(var(--v-theme-primary), 0.1);
}

.category-main-zone {
  background-color: rgba(var(--v-theme-secondary), 0.1);
}

.category-additional-zone {
  background-color: rgba(var(--v-theme-success), 0.1);
}

.category-space-heating-cooling {
  background-color: rgba(var(--v-theme-warning), 0.1);
}

.category-tank {
  background-color: rgba(var(--v-theme-info), 0.1);
}

.category-user-settings {
  background-color: rgba(var(--v-theme-error), 0.1);
}

.category-installer-settings {
  background-color: rgba(var(--v-theme-surface-variant), 0.1);
}
</style>