/**
 * Category legend component for the settings matrix
 */
<template>
  <v-card flat>
    <v-card-text class="pa-2">
      <div class="d-flex flex-wrap gap-2">
        <v-chip
          v-for="category in categories"
          :key="category.name"
          :color="category.color"
          variant="tonal"
          label
          size="small"
        >
          <template v-slot:prepend>
            <v-icon size="small">{{ category.icon }}</v-icon>
          </template>
          {{ category.name }}
        </v-chip>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import type { CategoryLegend } from '../types'

const props = defineProps<{
  categories: CategoryLegend[]
}>()
</script>